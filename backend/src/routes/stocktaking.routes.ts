import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

// 取得所有盤點單
router.get('/', (req: Request, res: Response) => {
  const { branch_id, role } = req.query;
  
  let sql = `
    SELECT s.*, b.name as branch_name
    FROM stocktaking s
    LEFT JOIN branches b ON s.branch_id = b.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // 如果是店員，只能看自己分店的盤點
  if (role === 'staff' && branch_id) {
    sql += ' AND s.branch_id = ?';
    params.push(branch_id);
  }

  sql += ' ORDER BY s.created_at DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 取得單一盤點單（包含明細）
router.get('/:id', (req: Request, res: Response) => {
  db.get('SELECT * FROM stocktaking WHERE id = ?', [req.params.id], (err, stocktaking) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!stocktaking) {
      res.status(404).json({ error: '盤點單不存在' });
      return;
    }

    // 取得明細
    const detailSql = `
      SELECT sd.*, p.barcode, p.name, p.brand, p.category
      FROM stocktaking_details sd
      JOIN products p ON sd.product_id = p.id
      WHERE sd.stocktaking_id = ?
      ORDER BY p.name
    `;

    db.all(detailSql, [req.params.id], (detailErr, details) => {
      if (detailErr) {
        res.status(500).json({ error: detailErr.message });
        return;
      }
      res.json({ ...stocktaking, details });
    });
  });
});

// 建立新盤點單
router.post('/', (req: Request, res: Response) => {
  const { branch_id, stocktaking_date, notes, created_by, categories } = req.body;

  if (!stocktaking_date) {
    res.status(400).json({ error: '盤點日期為必填' });
    return;
  }

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 建立盤點單
    const sql = 'INSERT INTO stocktaking (branch_id, stocktaking_date, notes, created_by) VALUES (?, ?, ?, ?)';

    db.run(sql, [branch_id || 1, stocktaking_date, notes, created_by], function(err) {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }

      const stocktakingId = this.lastID;

      // 根據類別和分店篩選建立盤點明細
      let detailSql = `
        INSERT INTO stocktaking_details (stocktaking_id, product_id, system_quantity, actual_quantity, difference)
        SELECT ?, p.id, COALESCE(i.quantity, 0), 0, 0
        FROM products p
        LEFT JOIN inventory i ON p.id = i.product_id AND i.branch_id = ?
        WHERE p.owner_branch_id = ?
      `;

      const params: any[] = [stocktakingId, branch_id || 1, branch_id || 1];

      // 如果有指定類別，只盤點這些類別的商品
      if (categories && Array.isArray(categories) && categories.length > 0) {
        const placeholders = categories.map(() => '?').join(',');
        detailSql += ` AND p.category IN (${placeholders})`;
        params.push(...categories);
      }

      db.run(detailSql, params, function(detailErr) {
        if (detailErr) {
          db.run('ROLLBACK');
          res.status(500).json({ error: detailErr.message });
          return;
        }

        db.run('COMMIT');
        res.status(201).json({ id: stocktakingId, message: '盤點單建立成功' });
      });
    });
  });
});

// 更新盤點明細
router.put('/details/:id', (req: Request, res: Response) => {
  const { actual_quantity, notes } = req.body;

  if (actual_quantity === undefined) {
    res.status(400).json({ error: '實際數量為必填' });
    return;
  }

  // 先取得系統數量
  db.get('SELECT system_quantity FROM stocktaking_details WHERE id = ?', [req.params.id], (err, row: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '盤點明細不存在' });
      return;
    }

    const difference = actual_quantity - row.system_quantity;

    const sql = `
      UPDATE stocktaking_details 
      SET actual_quantity = ?, difference = ?, notes = ?
      WHERE id = ?
    `;

    db.run(sql, [actual_quantity, difference, notes || null, req.params.id], function(updateErr) {
      if (updateErr) {
        res.status(500).json({ error: updateErr.message });
        return;
      }
      res.json({ message: '盤點明細更新成功', actual_quantity, difference });
    });
  });
});

// 完成盤點並調整庫存
router.post('/:id/complete', (req: Request, res: Response) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 取得所有盤點明細
    const detailSql = 'SELECT product_id, difference FROM stocktaking_details WHERE stocktaking_id = ? AND difference != 0';

    db.all(detailSql, [req.params.id], (err, details: any[]) => {
      if (err) {
        db.run('ROLLBACK');
        res.status(500).json({ error: err.message });
        return;
      }

      // 更新庫存
      let completed = 0;
      details.forEach((detail) => {
        db.run(
          'UPDATE inventory SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ?',
          [detail.difference, detail.product_id],
          function(updateErr) {
            if (updateErr) {
              db.run('ROLLBACK');
              res.status(500).json({ error: updateErr.message });
              return;
            }

            // 記錄調整記錄
            db.run(
              'INSERT INTO stock_movements (product_id, movement_type, quantity, notes, operator) VALUES (?, ?, ?, ?, ?)',
              [detail.product_id, 'ADJUST', Math.abs(detail.difference), `盤點調整 (盤點單 #${req.params.id})`, 'SYSTEM']
            );

            completed++;
            if (completed === details.length) {
              // 更新盤點單狀態
              db.run(
                'UPDATE stocktaking SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['COMPLETED', req.params.id],
                function(finalErr) {
                  if (finalErr) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: finalErr.message });
                    return;
                  }

                  db.run('COMMIT');
                  res.json({ message: '盤點完成，庫存已調整' });
                }
              );
            }
          }
        );
      });

      // 如果沒有差異項目，直接完成
      if (details.length === 0) {
        db.run(
          'UPDATE stocktaking SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['COMPLETED', req.params.id],
          function(finalErr) {
            if (finalErr) {
              db.run('ROLLBACK');
              res.status(500).json({ error: finalErr.message });
              return;
            }

            db.run('COMMIT');
            res.json({ message: '盤點完成，無需調整庫存' });
          }
        );
      }
    });
  });
});

// 刪除盤點單
router.delete('/:id', (req: Request, res: Response) => {
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // 先刪除盤點明細
    db.run('DELETE FROM stocktaking_details WHERE stocktaking_id = ?', [req.params.id], (detailErr) => {
      if (detailErr) {
        db.run('ROLLBACK');
        res.status(500).json({ error: detailErr.message });
        return;
      }

      // 再刪除盤點單
      db.run('DELETE FROM stocktaking WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          db.run('ROLLBACK');
          res.status(500).json({ error: err.message });
          return;
        }

        if (this.changes === 0) {
          db.run('ROLLBACK');
          res.status(404).json({ error: '盤點單不存在' });
          return;
        }

        db.run('COMMIT');
        res.json({ message: '盤點單已刪除' });
      });
    });
  });
});

export default router;
