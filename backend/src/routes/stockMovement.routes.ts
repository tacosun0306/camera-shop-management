import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

// 取得所有出入庫記錄
router.get('/', (req: Request, res: Response) => {
  const { startDate, endDate, type, productId, category, branchId } = req.query;
  
  let sql = `
    SELECT 
      sm.*,
      p.barcode,
      p.name,
      p.brand,
      p.category,
      fb.name as from_branch_name,
      tb.name as to_branch_name
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN branches fb ON sm.from_branch_id = fb.id
    LEFT JOIN branches tb ON sm.to_branch_id = tb.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (startDate) {
    sql += ' AND DATE(sm.created_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(sm.created_at) <= ?';
    params.push(endDate);
  }

  if (type) {
    sql += ' AND sm.movement_type = ?';
    params.push(type);
  }

  if (productId) {
    sql += ' AND sm.product_id = ?';
    params.push(productId);
  }

  if (category) {
    sql += ' AND p.category = ?';
    params.push(category);
  }

  if (branchId) {
    sql += ' AND (sm.from_branch_id = ? OR sm.to_branch_id = ?)';
    params.push(branchId, branchId);
  }

  sql += ' ORDER BY sm.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增出入庫記錄
router.post('/', (req: Request, res: Response) => {
  const { product_id, movement_type, quantity, cost, amount, from_branch_id, to_branch_id, reference_no, notes, operator } = req.body;

  if (!product_id || !movement_type || !quantity) {
    res.status(400).json({ error: '商品ID、類型和數量為必填' });
    return;
  }

  // 驗證必填欄位
  if (movement_type === 'SALE' && !amount) {
    res.status(400).json({ error: '售出時金額為必填' });
    return;
  }

  if (movement_type === 'TRANSFER' && (!from_branch_id || !to_branch_id)) {
    res.status(400).json({ error: '調貨時來源分店和目標分店為必填' });
    return;
  }

  if (movement_type === 'TRANSFER' && from_branch_id === to_branch_id) {
    res.status(400).json({ error: '來源分店和目標分店不能相同' });
    return;
  }

  // 開始交易
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 新增出入庫記錄
    const sql = `
      INSERT INTO stock_movements (product_id, movement_type, quantity, cost, amount, from_branch_id, to_branch_id, reference_no, notes, operator)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(sql, [product_id, movement_type, quantity, cost, amount, from_branch_id, to_branch_id, reference_no, notes, operator], function(err) {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }

      const movementId = this.lastID;

      // 更新庫存
      if (movement_type === 'IN') {
        // 入庫：增加目標分店庫存
        const updateSql = `
          INSERT INTO inventory (product_id, branch_id, quantity)
          VALUES (?, ?, ?)
          ON CONFLICT(product_id, branch_id) 
          DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
        `;
        db.run(updateSql, [product_id, to_branch_id || 1, quantity, quantity], function(updateErr) {
          if (updateErr) {
            db.run('ROLLBACK');
            res.status(500).json({ error: updateErr.message });
            return;
          }
          db.run('COMMIT');
          res.status(201).json({ id: movementId, message: '出入庫記錄新增成功' });
        });
      } else if (movement_type === 'SALE') {
        // 售出：減少來源分店庫存
        const updateSql = 'UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?';
        db.run(updateSql, [quantity, product_id, from_branch_id || 1], function(updateErr) {
          if (updateErr) {
            db.run('ROLLBACK');
            res.status(500).json({ error: updateErr.message });
            return;
          }
          db.run('COMMIT');
          res.status(201).json({ id: movementId, message: '出入庫記錄新增成功' });
        });
      } else if (movement_type === 'TRANSFER') {
        // 調貨：減少來源分店，增加目標分店
        const decreaseSql = 'UPDATE inventory SET quantity = quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?';
        db.run(decreaseSql, [quantity, product_id, from_branch_id], (decreaseErr) => {
          if (decreaseErr) {
            db.run('ROLLBACK');
            res.status(500).json({ error: decreaseErr.message });
            return;
          }
          
          const increaseSql = `
            INSERT INTO inventory (product_id, branch_id, quantity)
            VALUES (?, ?, ?)
            ON CONFLICT(product_id, branch_id) 
            DO UPDATE SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
          `;
          db.run(increaseSql, [product_id, to_branch_id, quantity, quantity], function(increaseErr) {
            if (increaseErr) {
              db.run('ROLLBACK');
              res.status(500).json({ error: increaseErr.message });
              return;
            }
            db.run('COMMIT');
            res.status(201).json({ id: movementId, message: '出入庫記錄新增成功' });
          });
        });
      } else if (movement_type === 'ADJUST') {
        // 調整：直接設定數量
        const updateSql = 'UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND branch_id = ?';
        db.run(updateSql, [quantity, product_id, from_branch_id || 1], function(updateErr) {
          if (updateErr) {
            db.run('ROLLBACK');
            res.status(500).json({ error: updateErr.message });
            return;
          }
          db.run('COMMIT');
          res.status(201).json({ id: movementId, message: '出入庫記錄新增成功' });
        });
      }
    });
  });
});

// 根據商品取得出入庫記錄
router.get('/product/:productId', (req: Request, res: Response) => {
  const sql = `
    SELECT * FROM stock_movements 
    WHERE product_id = ? 
    ORDER BY created_at DESC
  `;

  db.all(sql, [req.params.productId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

export default router;
