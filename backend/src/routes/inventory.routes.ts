import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

// 取得所有庫存（包含商品資訊）
router.get('/', (req: Request, res: Response) => {
  const { branch_id, role } = req.query;
  
  let sql = `
    SELECT 
      i.*,
      p.barcode,
      p.name,
      p.brand,
      p.category,
      p.cost_price,
      p.selling_price,
      p.min_stock_level,
      p.owner_branch_id,
      b.name as branch_name,
      ob.name as owner_branch_name
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    LEFT JOIN branches b ON i.branch_id = b.id
    LEFT JOIN branches ob ON p.owner_branch_id = ob.id
    WHERE 1=1
  `;
  const params: any[] = [];

  sql += ' ORDER BY p.name';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 取得低庫存商品
router.get('/low-stock', (req: Request, res: Response) => {
  const sql = `
    SELECT i.*, p.barcode, p.name, p.brand, p.category, p.min_stock_level
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.quantity <= p.min_stock_level
    ORDER BY i.quantity ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 根據商品ID取得庫存
router.get('/product/:productId', (req: Request, res: Response) => {
  db.get('SELECT * FROM inventory WHERE product_id = ?', [req.params.productId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '庫存記錄不存在' });
      return;
    }
    res.json(row);
  });
});

// 更新庫存數量
router.put('/product/:productId', (req: Request, res: Response) => {
  const { quantity, location } = req.body;

  const sql = `
    UPDATE inventory 
    SET quantity = ?, location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE product_id = ?
  `;

  db.run(sql, [quantity, location, req.params.productId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '庫存記錄不存在' });
      return;
    }
    res.json({ message: '庫存更新成功' });
  });
});

export default router;
