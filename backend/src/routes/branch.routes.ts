import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

// 取得所有分店
router.get('/', (req: Request, res: Response) => {
  const sql = 'SELECT * FROM branches WHERE is_active = 1 ORDER BY code';
  
  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 取得單一分店
router.get('/:id', (req: Request, res: Response) => {
  const sql = 'SELECT * FROM branches WHERE id = ?';
  
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '找不到該分店' });
      return;
    }
    res.json(row);
  });
});

// 新增分店
router.post('/', (req: Request, res: Response) => {
  const { code, name, address, phone, manager } = req.body;

  if (!code || !name) {
    res.status(400).json({ error: '分店代碼和名稱為必填' });
    return;
  }

  const sql = `
    INSERT INTO branches (code, name, address, phone, manager)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(sql, [code, name, address, phone, manager], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE')) {
        res.status(400).json({ error: '分店代碼已存在' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.status(201).json({ id: this.lastID, message: '分店新增成功' });
  });
});

// 更新分店
router.put('/:id', (req: Request, res: Response) => {
  const { code, name, address, phone, manager } = req.body;

  const sql = `
    UPDATE branches
    SET code = ?, name = ?, address = ?, phone = ?, manager = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(sql, [code, name, address, phone, manager, req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '找不到該分店' });
      return;
    }
    res.json({ message: '分店更新成功' });
  });
});

// 停用分店（軟刪除）
router.delete('/:id', (req: Request, res: Response) => {
  if (req.params.id === '1') {
    res.status(400).json({ error: '無法刪除總店' });
    return;
  }

  const sql = 'UPDATE branches SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

  db.run(sql, [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '找不到該分店' });
      return;
    }
    res.json({ message: '分店已停用' });
  });
});

// 取得分店庫存統計
router.get('/:id/inventory', (req: Request, res: Response) => {
  const sql = `
    SELECT 
      i.*,
      p.barcode,
      p.name,
      p.brand,
      p.category,
      p.selling_price
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    WHERE i.branch_id = ?
    ORDER BY p.name
  `;

  db.all(sql, [req.params.id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

export default router;
