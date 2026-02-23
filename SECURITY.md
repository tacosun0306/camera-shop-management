# 相機店管理系統 - 安全功能說明

## ✅ 已實作的安全功能

### 1. 密碼加密（Bcrypt）
- ✅ 使用 bcrypt 對密碼進行加密（10 rounds）
- ✅ 註冊/新增用戶時自動加密密碼
- ✅ 登入時使用 bcrypt.compare 驗證密碼
- ✅ 更新密碼時重新加密
- ✅ 預設管理員密碼已加密儲存

### 2. JWT Token 身份驗證
- ✅ 登入成功後生成 JWT Token
- ✅ Token 有效期：8 小時
- ✅ Token 包含：用戶ID、用戶名、角色、分店ID
- ✅ 前端自動在每個 API 請求中攜帶 Token
- ✅ Token 過期自動跳轉登入頁面

### 3. API 權限驗證
- ✅ 所有 API（除了登入）都需要 Token 驗證
- ✅ 管理員專屬功能：
  - 用戶管理（新增/修改/刪除）
  - 分店管理
  - 查看報表
- ✅ 角色權限檢查中間件

### 4. 操作日誌（Audit Log）
- ✅ 記錄所有重要操作：
  - 用戶登入
  - 新增/修改/刪除用戶
  - 其他關鍵操作
- ✅ 記錄資訊包含：
  - 操作用戶
  - 操作類型
  - 影響的表和記錄
  - IP 位址
  - User Agent
  - 時間戳記

### 5. 前端安全
- ✅ Token 自動管理（localStorage）
- ✅ API 攔截器自動添加 Token
- ✅ 401/403 自動登出並跳轉
- ✅ 路由守衛保護頁面

---

## 📋 資料庫變更

### 新增表：audit_logs
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  username TEXT,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### users 表更新
- password 欄位現在儲存 bcrypt 加密後的密碼

---

## 🔑 預設帳號

**管理員帳號：**
- 帳號：`admin`
- 密碼：`admin123`
- 角色：admin
- 分店：總店

⚠️ **重要：部署到生產環境前請務必修改預設密碼！**

---

## 🔒 安全最佳實踐

### 1. 環境變數設定
在 `.env` 文件中設定（請勿提交到 Git）：
```env
JWT_SECRET=your-very-long-secret-key-here-change-this-in-production
JWT_EXPIRES_IN=8h
PORT=3000
NODE_ENV=production
```

### 2. 生產環境建議
- ✅ 使用強密碼作為 JWT_SECRET（至少 32 字元）
- ✅ 啟用 HTTPS（使用 Let's Encrypt 免費憑證）
- ✅ 設定 CORS 白名單
- ✅ 使用防火牆限制端口訪問
- ✅ 定期備份資料庫
- ✅ 定期更新依賴套件

### 3. Token 過期處理
- Token 有效期為 8 小時
- 過期後自動跳轉到登入頁面
- 用戶需要重新登入獲取新 Token

### 4. 密碼政策建議
- 最少 8 個字元
- 包含大小寫字母、數字
- 定期更換密碼
- 不要重複使用舊密碼

---

## 🚀 啟動系統

### 後端
```bash
cd backend
npm run build
npm start
```

### 前端
```bash
cd frontend
npm run dev
```

---

## 📊 查看操作日誌

可以直接查詢資料庫查看操作記錄：
```sql
SELECT 
  username,
  action,
  table_name,
  created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 100;
```

---

## 🔐 後續可以加強的功能

### 短期（建議）
- [ ] 密碼強度驗證
- [ ] 登入失敗次數限制（防暴力破解）
- [ ] 記住登入狀態（Refresh Token）
- [ ] 操作日誌查詢介面

### 中期
- [ ] 雙因素驗證（2FA）
- [ ] 資料庫加密（SQLCipher）
- [ ] IP 白名單
- [ ] 會話管理（強制登出）

### 長期
- [ ] 完整的權限管理系統（RBAC）
- [ ] 資料欄位級別加密
- [ ] 安全審計報表
- [ ] 異常行為檢測

---

## 📞 支援

如有安全相關問題，請聯繫系統管理員。

**最後更新：2026年1月20日**
