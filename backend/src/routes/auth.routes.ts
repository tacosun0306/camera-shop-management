import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { logFromRequest } from '../utils/auditLog';

const router = Router();

// 登入
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: '請輸入帳號和密碼' });
    return;
  }

  const sql = `
    SELECT u.*, b.name as branch_name, b.code as branch_code
    FROM users u
    JOIN branches b ON u.branch_id = b.id
    WHERE u.username = ? AND u.is_active = 1
  `;

  db.get(sql, [username], async (err, user: any) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!user) {
      res.status(401).json({ error: '帳號或密碼錯誤' });
      return;
    }

    // 驗證密碼
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: '帳號或密碼錯誤' });
      return;
    }

    // 生成 JWT Token
    const secret = process.env.JWT_SECRET || 'camera-shop-secret-key';
    
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id
      },
      secret,
      { expiresIn: '8h' }
    );

    // 移除密碼欄位
    delete user.password;

    // 記錄登入日誌
    try {
      await logFromRequest(
        { user: { id: user.id, username: user.username, role: user.role, branch_id: user.branch_id }, ip: req.ip, socket: req.socket, get: req.get.bind(req) } as any,
        '用戶登入',
        'users',
        user.id
      );
    } catch (logErr) {
      console.error('記錄登入日誌失敗:', logErr);
    }

    res.json({
      message: '登入成功',
      token,
      user: user
    });
  });
});

// 取得當前用戶資訊
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  const sql = `
    SELECT u.id, u.username, u.name, u.branch_id, u.role, b.name as branch_name, b.code as branch_code
    FROM users u
    JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ? AND u.is_active = 1
  `;

  db.get(sql, [req.user?.id], (err, user) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!user) {
      res.status(404).json({ error: '找不到用戶' });
      return;
    }

    res.json(user);
  });
});

// 取得所有用戶（管理員用）
router.get('/users', authenticateToken, requireAdmin, (req: Request, res: Response) => {
  const sql = `
    SELECT u.id, u.username, u.name, u.branch_id, u.role, u.is_active, u.created_at,
           b.name as branch_name
    FROM users u
    JOIN branches b ON u.branch_id = b.id
    ORDER BY u.created_at DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// 新增用戶
router.post('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { username, password, name, branch_id, role } = req.body;

  if (!username || !password || !name || !branch_id) {
    res.status(400).json({ error: '請填寫所有必填欄位' });
    return;
  }

  try {
    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const sql = `
      INSERT INTO users (username, password, name, branch_id, role)
      VALUES (?, ?, ?, ?, ?)
    `;

    db.run(sql, [username, hashedPassword, name, branch_id, role || 'staff'], async function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          res.status(400).json({ error: '帳號已存在' });
        } else {
          res.status(500).json({ error: err.message });
        }
        return;
      }

      // 記錄操作日誌
      await logFromRequest(req, '新增用戶', 'users', this.lastID, null, { username, name, branch_id, role });

      res.status(201).json({ id: this.lastID, message: '用戶新增成功' });
    });
  } catch (error) {
    res.status(500).json({ error: '密碼加密失敗' });
  }
});

// 更新用戶
router.put('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const { name, branch_id, role, is_active, password } = req.body;

  let sql = `
    UPDATE users
    SET name = ?, branch_id = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
  `;
  let params: any[] = [name, branch_id, role, is_active];

  // 如果有提供新密碼，則加密後更新
  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql += ', password = ?';
      params.push(hashedPassword);
    } catch (error) {
      res.status(500).json({ error: '密碼加密失敗' });
      return;
    }
  }

  sql += ' WHERE id = ?';
  params.push(req.params.id);

  db.run(sql, params, async function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '找不到該用戶' });
      return;
    }

    // 記錄操作日誌
    await logFromRequest(req, '更新用戶', 'users', Number(req.params.id), null, { name, branch_id, role, is_active });
    res.json({ message: '用戶更新成功' });
  });
});

// 刪除用戶（軟刪除）
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  if (req.params.id === '1') {
    res.status(400).json({ error: '無法刪除系統管理員' });
    return;
  }

  const sql = 'UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?';

  db.run(sql, [req.params.id], async function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '找不到該用戶' });
      return;
    }

    // 記錄操作日誌
    await logFromRequest(req, '刪除用戶（軟刪除）', 'users', Number(req.params.id));

    res.json({ message: '用戶已停用' });
  });
});

export default router;
