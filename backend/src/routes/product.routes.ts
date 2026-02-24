import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

// 取得所有商品
router.get('/', (req: Request, res: Response) => {
  const { search, category, branch_id, role } = req.query;
  
  let sql = `
    SELECT p.*, b.name as owner_branch_name
    FROM products p
    LEFT JOIN branches b ON p.owner_branch_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // 如果是店員，只能看自己分店的商品
  if (role === 'staff' && branch_id) {
    sql += ' AND p.owner_branch_id = ?';
    params.push(branch_id);
  }

  if (search) {
    sql += ' AND (p.name LIKE ? OR p.barcode LIKE ? OR p.brand LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (category) {
    sql += ' AND p.category = ?';
    params.push(category);
  }

  sql += ' ORDER BY p.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 根據ID取得商品
router.get('/:id', (req: Request, res: Response) => {
  db.get('SELECT * FROM products WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }
    res.json(row);
  });
});

// 根據條碼取得商品
router.get('/barcode/:barcode', (req: Request, res: Response) => {
  db.get('SELECT * FROM products WHERE barcode = ?', [req.params.barcode], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }
    res.json(row);
  });
});

// 新增商品
router.post('/', (req: Request, res: Response) => {
  const { barcode, name, brand, category, model, description, cost_price, selling_price, min_stock_level, branch_id, initial_quantity } = req.body;

  if (!barcode || !name) {
    res.status(400).json({ error: '條碼和商品名稱為必填' });
    return;
  }

  const sql = `
    INSERT INTO products (barcode, name, brand, category, model, description, cost_price, selling_price, min_stock_level, owner_branch_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [barcode, name, brand, category, model, description, cost_price, selling_price, min_stock_level, branch_id || 1], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        res.status(400).json({ error: '條碼已存在' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }

    const productId = this.lastID;
    const initialQty = initial_quantity || 0;

    // 建立該分店的庫存記錄（使用初始庫存量）
    const inventorySql = 'INSERT INTO inventory (product_id, branch_id, quantity) VALUES (?, ?, ?)';
    db.run(inventorySql, [productId, branch_id || 1, initialQty], (invErr) => {
      if (invErr) {
        console.error('建立庫存記錄錯誤:', invErr);
      }
    });

    res.status(201).json({ id: productId, message: '商品新增成功' });
  });
});

// 更新商品
router.put('/:id', (req: Request, res: Response) => {
  const { name, brand, category, model, description, cost_price, selling_price, min_stock_level } = req.body;

  const sql = `
    UPDATE products 
    SET name = ?, brand = ?, category = ?, model = ?, description = ?, 
        cost_price = ?, selling_price = ?, min_stock_level = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(sql, [name, brand, category, model, description, cost_price, selling_price, min_stock_level, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }
    res.json({ message: '商品更新成功' });
  });
});

// 刪除商品
router.delete('/:id', (req: Request, res: Response) => {
  db.run('DELETE FROM products WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }
    res.json({ message: '商品刪除成功' });
  });
});

export default router;
