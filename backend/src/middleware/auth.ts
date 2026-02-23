import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    branch_id: number;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: '未提供驗證令牌' });
    return;
  }

  const secret = process.env.JWT_SECRET || 'camera-shop-secret-key';

  jwt.verify(token, secret, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: '無效或過期的令牌' });
      return;
    }

    req.user = decoded;
    next();
  });
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: '需要管理員權限' });
    return;
  }
  next();
};

export const requireStaffOrAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'staff')) {
    res.status(403).json({ error: '權限不足' });
    return;
  }
  next();
};
