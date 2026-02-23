import { Router, Request, Response } from 'express';
import { db } from '../config/database';

const router = Router();

// 取得所有維修品
router.get('/', (req: Request, res: Response) => {
  const { status, startDate, endDate } = req.query;
  
  let sql = 'SELECT * FROM repairs WHERE 1=1';
  const params: any[] = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (startDate) {
    sql += ' AND DATE(received_date) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND DATE(received_date) <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY received_date DESC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 根據ID取得維修品
router.get('/:id', (req: Request, res: Response) => {
  db.get('SELECT * FROM repairs WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '維修品不存在' });
      return;
    }
    res.json(row);
  });
});

// 根據維修單號取得維修品
router.get('/repair-no/:repairNo', (req: Request, res: Response) => {
  db.get('SELECT * FROM repairs WHERE repair_no = ?', [req.params.repairNo], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '維修品不存在' });
      return;
    }
    res.json(row);
  });
});

// 新增維修品
router.post('/', (req: Request, res: Response) => {
  const {
    repair_no, customer_name, customer_phone, item_name, item_brand, item_model,
    problem_description, estimated_cost, received_date, estimated_completion_date, notes
  } = req.body;

  if (!repair_no || !customer_name || !customer_phone || !item_name || !received_date) {
    res.status(400).json({ error: '維修單號、客戶姓名、客戶電話、物品名稱、收件日期為必填' });
    return;
  }

  const sql = `
    INSERT INTO repairs (
      repair_no, customer_name, customer_phone, item_name, item_brand, item_model,
      problem_description, estimated_cost, received_date, estimated_completion_date, notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [repair_no, customer_name, customer_phone, item_name, item_brand, item_model,
     problem_description, estimated_cost, received_date, estimated_completion_date, notes],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          res.status(400).json({ error: '維修單號已存在' });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }
      res.status(201).json({ id: this.lastID, message: '維修品登記成功' });
    }
  );
});

// 更新維修品
router.put('/:id', (req: Request, res: Response) => {
  const {
    customer_name, customer_phone, item_name, item_brand, item_model,
    problem_description, estimated_cost, actual_cost, status,
    estimated_completion_date, completed_date, delivered_date, notes
  } = req.body;

  const sql = `
    UPDATE repairs 
    SET customer_name = ?, customer_phone = ?, item_name = ?, item_brand = ?, item_model = ?,
        problem_description = ?, estimated_cost = ?, actual_cost = ?, status = ?,
        estimated_completion_date = ?, completed_date = ?, delivered_date = ?, 
        notes = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(
    sql,
    [customer_name, customer_phone, item_name, item_brand, item_model,
     problem_description, estimated_cost, actual_cost, status,
     estimated_completion_date, completed_date, delivered_date, notes, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: '維修品不存在' });
        return;
      }
      res.json({ message: '維修品更新成功' });
    }
  );
});

// 刪除維修品
router.delete('/:id', (req: Request, res: Response) => {
  db.run('DELETE FROM repairs WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '維修品不存在' });
      return;
    }
    res.json({ message: '維修品刪除成功' });
  });
});

export default router;
