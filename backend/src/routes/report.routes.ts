import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

// 庫存總覽報表
router.get('/inventory-summary', (req: Request, res: Response) => {
  const sql = `
    SELECT 
      COUNT(*) as total_products,
      SUM(i.quantity) as total_stock,
      SUM(CASE WHEN i.quantity <= p.min_stock_level THEN 1 ELSE 0 END) as low_stock_count,
      SUM(i.quantity * p.cost_price) as total_cost_value,
      SUM(i.quantity * p.selling_price) as total_selling_value
    FROM inventory i
    JOIN products p ON i.product_id = p.id
  `;

  db.get(sql, [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(row);
  });
});

// 出入庫統計
router.get('/stock-movement-stats', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  let sql = `
    SELECT 
      movement_type,
      COUNT(*) as count,
      SUM(quantity) as total_quantity
    FROM stock_movements
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(endDate);
  }

  sql += ' GROUP BY movement_type';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 維修品統計
router.get('/repair-stats', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  let sql = `
    SELECT 
      status,
      COUNT(*) as count,
      SUM(estimated_cost) as total_estimated,
      SUM(actual_cost) as total_actual
    FROM repairs
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    sql += ' AND DATE(received_date) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(received_date) <= ?';
    params.push(endDate);
  }

  sql += ' GROUP BY status';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 每日出入庫趨勢
router.get('/daily-movements', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  
  let sql = `
    SELECT 
      DATE(created_at) as date,
      movement_type,
      COUNT(*) as count,
      SUM(quantity) as total_quantity
    FROM stock_movements
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    sql += ' AND DATE(created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(created_at) <= ?';
    params.push(endDate);
  }

  sql += ' GROUP BY DATE(created_at), movement_type ORDER BY date DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 熱銷商品
router.get('/top-products', (req: Request, res: Response) => {
  const { limit = 10 } = req.query;
  
  const sql = `
    SELECT 
      p.id, p.name, p.brand, p.category,
      COUNT(sm.id) as sales_count,
      SUM(sm.quantity) as total_sold
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    WHERE sm.movement_type = 'OUT'
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT ?
  `;

  db.all(sql, [limit], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 分類統計
router.get('/category-stats', (req: Request, res: Response) => {
  const sql = `
    SELECT 
      p.category,
      COUNT(DISTINCT p.id) as product_count,
      SUM(i.quantity) as total_stock,
      SUM(i.quantity * p.selling_price) as total_value
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    GROUP BY p.category
    ORDER BY total_value DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

export default router;
