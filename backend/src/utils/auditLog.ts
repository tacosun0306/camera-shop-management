import { db } from '../config/database';
import { AuthRequest } from '../middleware/auth';

export interface AuditLogParams {
  userId?: number;
  username?: string;
  action: string;
  tableName?: string;
  recordId?: number;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const createAuditLog = (params: AuditLogParams): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO audit_logs (
        user_id, username, action, table_name, record_id, 
        old_value, new_value, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
      sql,
      [
        params.userId || null,
        params.username || null,
        params.action,
        params.tableName || null,
        params.recordId || null,
        params.oldValue || null,
        params.newValue || null,
        params.ipAddress || null,
        params.userAgent || null,
      ],
      (err) => {
        if (err) {
          console.error('記錄操作日誌失敗:', err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
};

export const logFromRequest = async (
  req: AuthRequest,
  action: string,
  tableName?: string,
  recordId?: number,
  oldValue?: any,
  newValue?: any
) => {
  try {
    await createAuditLog({
      userId: req.user?.id,
      username: req.user?.username,
      action,
      tableName,
      recordId,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    });
  } catch (error) {
    console.error('記錄操作日誌異常:', error);
  }
};
