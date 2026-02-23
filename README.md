# 📷 相機店管理系統

完整功能的相機店管理系統，包含商品管理、庫存追蹤、條碼掃描、盤點功能、維修品管理及報表分析。

## 🌟 主要功能

### 1. 商品/庫存管理
- ✅ 商品 CRUD 操作（新增、查詢、修改、刪除）
- ✅ 條碼管理
- ✅ 庫存數量即時追蹤
- ✅ 低庫存警告
- ✅ 商品分類管理
- ✅ 成本價與售價管理

### 2. 條碼掃描出入庫
- ✅ 手機/平板相機掃描條碼
- ✅ 入庫登記
- ✅ 出庫登記
- ✅ 庫存調整
- ✅ 出入庫歷史記錄

### 3. 每月盤點模式
- ✅ 建立盤點單
- ✅ 系統數量 vs 實際數量對比
- ✅ 差異記錄與追蹤
- ✅ 自動庫存調整
- ✅ 盤點報表

### 4. 維修品送件管理
- ✅ 維修單登記（不計入庫存）
- ✅ 客戶資訊管理
- ✅ 維修狀態追蹤
- ✅ 預估/實際費用記錄
- ✅ 維修進度管理

### 5. 報表與分析
- ✅ 庫存總覽報表
- ✅ 出入庫統計圖表
- ✅ 維修品狀態統計
- ✅ 熱銷商品排行
- ✅ 分類庫存價值分析

## 🛠️ 技術棧

### 前端
- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Vite** - 建置工具
- **Ant Design** - UI 元件庫
- **TailwindCSS** - CSS 框架
- **React Router** - 路由管理
- **Axios** - HTTP 請求
- **html5-qrcode** - 條碼掃描
- **Recharts** - 圖表展示
- **dayjs** - 日期處理
- **Zustand** - 狀態管理

### 後端
- **Node.js** - 運行環境
- **Express** - Web 框架
- **TypeScript** - 類型安全
- **SQLite** - 資料庫
- **CORS** - 跨域支援

## 📁 專案結構

```
camera/
├── frontend/               # 前端應用
│   ├── src/
│   │   ├── api/           # API 請求層
│   │   ├── components/    # 共用元件
│   │   ├── pages/         # 頁面元件
│   │   ├── App.tsx        # 主應用
│   │   └── main.tsx       # 入口檔案
│   ├── package.json
│   └── vite.config.ts
│
├── backend/               # 後端 API
│   ├── src/
│   │   ├── config/        # 配置檔案
│   │   ├── routes/        # API 路由
│   │   └── index.ts       # 入口檔案
│   ├── package.json
│   └── tsconfig.json
│
└── package.json          # 根目錄套件管理

```

## 🚀 快速開始

### 1. 安裝相依套件

```powershell
# 安裝根目錄套件
npm install

# 安裝所有子專案套件
npm run install:all
```

### 2. 設定後端環境變數

```powershell
# 複製環境變數範本
Copy-Item backend\.env.example backend\.env

# 編輯 .env 檔案（可選）
```

### 3. 啟動開發伺服器

```powershell
# 同時啟動前後端
npm run dev

# 或分別啟動
npm run dev:backend  # 後端: http://localhost:3000
npm run dev:frontend # 前端: http://localhost:5173
```

### 4. 開啟瀏覽器

訪問 `http://localhost:5173` 開始使用系統

## 📝 API 路由

### 商品管理
- `GET /api/products` - 取得所有商品
- `GET /api/products/:id` - 取得單一商品
- `GET /api/products/barcode/:barcode` - 根據條碼取得商品
- `POST /api/products` - 新增商品
- `PUT /api/products/:id` - 更新商品
- `DELETE /api/products/:id` - 刪除商品

### 庫存管理
- `GET /api/inventory` - 取得所有庫存
- `GET /api/inventory/low-stock` - 取得低庫存商品
- `GET /api/inventory/product/:productId` - 取得商品庫存
- `PUT /api/inventory/product/:productId` - 更新庫存

### 出入庫管理
- `GET /api/stock-movements` - 取得出入庫記錄
- `POST /api/stock-movements` - 新增出入庫記錄
- `GET /api/stock-movements/product/:productId` - 取得商品出入庫記錄

### 盤點管理
- `GET /api/stocktaking` - 取得所有盤點單
- `GET /api/stocktaking/:id` - 取得盤點單詳情
- `POST /api/stocktaking` - 建立盤點單
- `PUT /api/stocktaking/details/:id` - 更新盤點明細
- `POST /api/stocktaking/:id/complete` - 完成盤點

### 維修品管理
- `GET /api/repairs` - 取得所有維修品
- `GET /api/repairs/:id` - 取得維修品詳情
- `GET /api/repairs/repair-no/:repairNo` - 根據維修單號取得
- `POST /api/repairs` - 新增維修品
- `PUT /api/repairs/:id` - 更新維修品
- `DELETE /api/repairs/:id` - 刪除維修品

### 報表分析
- `GET /api/reports/inventory-summary` - 庫存總覽
- `GET /api/reports/stock-movement-stats` - 出入庫統計
- `GET /api/reports/repair-stats` - 維修品統計
- `GET /api/reports/daily-movements` - 每日出入庫趨勢
- `GET /api/reports/top-products` - 熱銷商品
- `GET /api/reports/category-stats` - 分類統計

## 🗄️ 資料庫結構

### products - 商品表
- id, barcode, name, brand, category, model
- description, cost_price, selling_price, min_stock_level
- created_at, updated_at

### inventory - 庫存表
- id, product_id, quantity, location, updated_at

### stock_movements - 出入庫記錄表
- id, product_id, movement_type, quantity
- reference_no, notes, operator, created_at

### stocktaking - 盤點表
- id, stocktaking_date, status, notes
- created_by, created_at, completed_at

### stocktaking_details - 盤點明細表
- id, stocktaking_id, product_id
- system_quantity, actual_quantity, difference, notes

### repairs - 維修品表
- id, repair_no, customer_name, customer_phone
- item_name, item_brand, item_model
- problem_description, estimated_cost, actual_cost
- status, received_date, estimated_completion_date
- completed_date, delivered_date, notes
- created_at, updated_at

## 📱 使用條碼掃描

系統支援使用手機或平板的相機進行條碼掃描：

1. 在出入庫頁面點擊「開始掃描」
2. 允許瀏覽器存取相機
3. 對準條碼進行掃描
4. 系統自動識別商品

## 🔧 開發指令

```powershell
# 前端開發
cd frontend
npm run dev

# 後端開發
cd backend
npm run dev

# 編譯前端
cd frontend
npm run build

# 編譯後端
cd backend
npm run build

# 生產環境啟動
cd backend
npm start
```

## 📦 建置部署

```powershell
# 編譯所有專案
npm run build

# 啟動生產環境後端
cd backend
npm start

# 前端靜態檔案位於 frontend/dist/
```

## 🎯 待辦功能

- [ ] 使用者登入與權限管理
- [ ] 商品圖片上傳
- [ ] 匯出 Excel 報表
- [ ] 供應商管理
- [ ] 採購單管理
- [ ] 客戶管理與會員系統
- [ ] 銷售訂單管理
- [ ] 多店面支援
- [ ] 行動裝置 APP

## 📄 授權

MIT License

## 👨‍💻 開發者

相機店管理系統團隊

## 🙋 技術支援

如有問題或建議，歡迎聯繫開發團隊。
