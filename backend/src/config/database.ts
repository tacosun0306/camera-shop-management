import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../database.sqlite');

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('資料庫連接錯誤:', err);
  } else {
    console.log('✅ SQLite 資料庫連接成功');
  }
});

export const initDatabase = () => {
  db.serialize(() => {
    // 分店表
    db.run(`
      CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        manager TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('建立 branches 表錯誤:', err);
    });

    // 插入預設分店（如果不存在）
    db.run(`
      INSERT OR IGNORE INTO branches (id, code, name, address, is_active)
      VALUES (1, 'MAIN', '總店', '', 1)
    `, (err) => {
      if (err) console.error('插入預設分店錯誤:', err);
    });

    // 用戶表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        branch_id INTEGER NOT NULL,
        role TEXT DEFAULT 'staff',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )
    `, (err) => {
      if (err) console.error('建立 users 表錯誤:', err);
    });

    // 插入預設管理員帳號（密碼：admin123）
    const defaultPassword = 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    
    db.run(`
      INSERT OR IGNORE INTO users (id, username, password, name, branch_id, role)
      VALUES (1, 'admin', ?, '系統管理員', 1, 'admin')
    `, [hashedPassword], (err) => {
      if (err) console.error('插入預設管理員錯誤:', err);
      else console.log('✅ 預設管理員帳號已建立（密碼已加密）');
    });

    // 商品表
    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        model TEXT,
        description TEXT,
        cost_price REAL DEFAULT 0,
        selling_price REAL DEFAULT 0,
        min_stock_level INTEGER DEFAULT 0,
        owner_branch_id INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_branch_id) REFERENCES branches(id)
      )
    `, (err) => {
      if (err) console.error('建立 products 表錯誤:', err);
      
      // 檢查並添加新欄位
      db.all("PRAGMA table_info(products)", (pragmaErr, columns: any[]) => {
        if (!pragmaErr && columns) {
          const hasOwnerBranch = columns.some(col => col.name === 'owner_branch_id');
          if (!hasOwnerBranch) {
            db.run("ALTER TABLE products ADD COLUMN owner_branch_id INTEGER DEFAULT 1", (alterErr) => {
              if (alterErr) console.error('添加 owner_branch_id 欄位錯誤:', alterErr);
            });
          }
        }
      });
    });

    // 庫存表
    db.run(`
      CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        branch_id INTEGER DEFAULT 1,
        quantity INTEGER DEFAULT 0,
        location TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )
    `, (err) => {
      if (err) console.error('建立 inventory 表錯誤:', err);
      
      // 檢查並添加新欄位
      db.all("PRAGMA table_info(inventory)", (pragmaErr, columns: any[]) => {
        if (!pragmaErr && columns) {
          const hasBranchId = columns.some(col => col.name === 'branch_id');
          if (!hasBranchId) {
            db.run("ALTER TABLE inventory ADD COLUMN branch_id INTEGER DEFAULT 1", (alterErr) => {
              if (alterErr) console.error('添加 branch_id 欄位錯誤:', alterErr);
            });
          }
        }
      });
    });

    // 出入庫記錄表
    db.run(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        from_branch_id INTEGER,
        to_branch_id INTEGER,
        movement_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        cost REAL,
        amount REAL,
        reference_no TEXT,
        notes TEXT,
        operator TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (from_branch_id) REFERENCES branches(id),
        FOREIGN KEY (to_branch_id) REFERENCES branches(id)
      )
    `, (err) => {
      if (err) console.error('建立 stock_movements 表錯誤:', err);
      
      // 檢查並添加新欄位
      db.all("PRAGMA table_info(stock_movements)", (pragmaErr, columns: any[]) => {
        if (!pragmaErr && columns) {
          const hasFromBranch = columns.some(col => col.name === 'from_branch_id');
          const hasToBranch = columns.some(col => col.name === 'to_branch_id');
          const hasAmount = columns.some(col => col.name === 'amount');
          const hasCost = columns.some(col => col.name === 'cost');
          
          if (!hasFromBranch) {
            db.run("ALTER TABLE stock_movements ADD COLUMN from_branch_id INTEGER", (alterErr) => {
              if (alterErr) console.error('添加 from_branch_id 欄位錯誤:', alterErr);
            });
          }
          if (!hasToBranch) {
            db.run("ALTER TABLE stock_movements ADD COLUMN to_branch_id INTEGER", (alterErr) => {
              if (alterErr) console.error('添加 to_branch_id 欄位錯誤:', alterErr);
            });
          }
          if (!hasAmount) {
            db.run("ALTER TABLE stock_movements ADD COLUMN amount REAL", (alterErr) => {
              if (alterErr) console.error('添加 amount 欄位錯誤:', alterErr);
            });
          }
          if (!hasCost) {
            db.run("ALTER TABLE stock_movements ADD COLUMN cost REAL", (alterErr) => {
              if (alterErr) console.error('添加 cost 欄位錯誤:', alterErr);
            });
          }
        }
      });
    });

    // 盤點表
    db.run(`
      CREATE TABLE IF NOT EXISTS stocktaking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        branch_id INTEGER DEFAULT 1,
        stocktaking_date DATE NOT NULL,
        status TEXT DEFAULT 'IN_PROGRESS',
        notes TEXT,
        created_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (branch_id) REFERENCES branches(id)
      )
    `, (err) => {
      if (err) console.error('建立 stocktaking 表錯誤:', err);
      
      // 檢查並添加新欄位
      db.all("PRAGMA table_info(stocktaking)", (pragmaErr, columns: any[]) => {
        if (!pragmaErr && columns) {
          const hasBranchId = columns.some(col => col.name === 'branch_id');
          if (!hasBranchId) {
            db.run("ALTER TABLE stocktaking ADD COLUMN branch_id INTEGER DEFAULT 1", (alterErr) => {
              if (alterErr) console.error('添加 branch_id 欄位錯誤:', alterErr);
            });
          }
        }
      });
    });

    // 盤點明細表
    db.run(`
      CREATE TABLE IF NOT EXISTS stocktaking_details (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stocktaking_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        system_quantity INTEGER DEFAULT 0,
        actual_quantity INTEGER DEFAULT 0,
        difference INTEGER DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (stocktaking_id) REFERENCES stocktaking(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('建立 stocktaking_details 表錯誤:', err);
    });

    // 維修品表
    db.run(`
      CREATE TABLE IF NOT EXISTS repairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repair_no TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        item_name TEXT NOT NULL,
        item_brand TEXT,
        item_model TEXT,
        problem_description TEXT,
        estimated_cost REAL,
        actual_cost REAL,
        status TEXT DEFAULT 'RECEIVED',
        received_date DATE NOT NULL,
        estimated_completion_date DATE,
        completed_date DATE,
        delivered_date DATE,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('建立 repairs 表錯誤:', err);
    });
    // 操作日誌表（審計追蹤）
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `, (err) => {
      if (err) console.error('建立 audit_logs 表錯誤:', err);
      else console.log('✅ 操作日誌表已建立');
    });
    console.log('✅ 資料庫表格初始化完成');
  });
};
