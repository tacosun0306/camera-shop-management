import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './config/database';
import { authenticateToken } from './middleware/auth';
import productRoutes from './routes/product.routes';
import inventoryRoutes from './routes/inventory.routes';
import stockMovementRoutes from './routes/stockMovement.routes';
import stocktakingRoutes from './routes/stocktaking.routes';
import repairRoutes from './routes/repair.routes';
import reportRoutes from './routes/report.routes';
import branchRoutes from './routes/branch.routes';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 中介軟體 - 允許所有來源（用於公網測試）
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化資料庫
initDatabase();

// 公開路由（不需驗證）
app.use('/api/auth', authRoutes);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: '相機店管理系統 API 運行中' });
});

// 調試端點 - 檢查數據庫狀態
app.get('/debug/users', (req, res) => {
  const sql = 'SELECT id, username, name, role, branch_id FROM users';
  require('./config/database').db.all(sql, [], (err: any, rows: any) => {
    if (err) {
      res.json({ error: err.message });
    } else {
      res.json({ users: rows });
    }
  });
});

// 受保護路由（需要 Token 驗證）
app.use('/api/products', authenticateToken, productRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/stock-movements', authenticateToken, stockMovementRoutes);
app.use('/api/stocktaking', authenticateToken, stocktakingRoutes);
app.use('/api/repairs', authenticateToken, repairRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/branches', authenticateToken, branchRoutes);

// 錯誤處理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: '伺服器錯誤', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 後端服務運行於 http://localhost:${PORT}`);
});
