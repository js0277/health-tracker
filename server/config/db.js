const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = path.join(__dirname, '..', 'data', 'health.db')

// Ensure data directory exists
const fs = require('fs')
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// 初始化表结构
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password_hash TEXT,
    openid TEXT,
    nickname TEXT DEFAULT '新用户',
    avatar TEXT DEFAULT '',
    gender INTEGER DEFAULT 0,
    height REAL,
    weight REAL,
    target_kcal INTEGER DEFAULT 2000,
    target_weight REAL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS foods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT DEFAULT '',
    kcal REAL NOT NULL,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbs REAL NOT NULL,
    fiber REAL DEFAULT 0,
    is_common INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS diet_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
    record_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS diet_record_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    food_name TEXT NOT NULL,
    grams REAL NOT NULL,
    kcal REAL NOT NULL,
    protein REAL NOT NULL,
    fat REAL NOT NULL,
    carbs REAL NOT NULL,
    FOREIGN KEY (record_id) REFERENCES diet_records(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id)
  );

  CREATE TABLE IF NOT EXISTS weight_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    weight REAL NOT NULL,
    record_date TEXT NOT NULL,
    record_time TEXT DEFAULT '08:00',
    note TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`)

// 初始化默认用户和示例食物（只执行一次）
// No default user - users register themselves

const foodCount = db.prepare('SELECT COUNT(*) as cnt FROM foods').get()
if (foodCount.cnt === 0) {
  const insertFood = db.prepare(
    'INSERT INTO foods (name, category, kcal, protein, fat, carbs, is_common) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const foods = [
    ['米饭(熟)', 'staple', 116, 2.6, 0.3, 25.6, 1],
    ['馒头', 'staple', 223, 7.0, 1.1, 44.2, 1],
    ['全麦面包', 'staple', 246, 8.5, 3.4, 43.6, 1],
    ['面条(煮)', 'staple', 110, 3.2, 0.3, 22.3, 1],
    ['小米粥', 'staple', 46, 1.4, 0.7, 8.4, 1],
    ['红薯', 'staple', 86, 1.6, 0.1, 20.1, 0],
    ['煮鸡蛋', 'meat', 144, 13.3, 8.8, 2.8, 1],
    ['鸡胸肉', 'meat', 133, 31.0, 1.2, 0, 1],
    ['牛排', 'meat', 131, 22.3, 4.5, 0.6, 1],
    ['三文鱼', 'meat', 139, 17.2, 7.8, 0, 1],
    ['猪瘦肉', 'meat', 143, 20.3, 6.2, 1.5, 1],
    ['豆腐', 'meat', 76, 8.1, 3.7, 2.8, 1],
    ['宫保鸡丁', 'meat', 174, 16.7, 11.2, 3.5, 0],
    ['西兰花', 'vegetable', 34, 2.8, 0.4, 6.6, 1],
    ['凉拌黄瓜', 'vegetable', 23, 1.2, 0.2, 4.2, 1],
    ['蒸南瓜', 'vegetable', 22, 0.7, 0.1, 4.6, 1],
    ['西红柿', 'vegetable', 18, 0.9, 0.2, 3.9, 1],
    ['菠菜', 'vegetable', 24, 2.6, 0.3, 4.5, 1],
    ['胡萝卜', 'vegetable', 37, 1.0, 0.2, 8.8, 0],
    ['炒青菜', 'vegetable', 42, 2.5, 2.8, 3.5, 0],
    ['苹果', 'fruit', 53, 0.2, 0.2, 13.5, 1],
    ['香蕉', 'fruit', 93, 1.4, 0.2, 20.8, 1],
    ['橙子', 'fruit', 47, 0.8, 0.2, 11.1, 1],
    ['葡萄', 'fruit', 67, 0.7, 0.2, 16.0, 0],
    ['西瓜', 'fruit', 30, 0.6, 0.1, 6.8, 0],
    ['牛奶(全脂)', 'drink', 61, 3.0, 3.2, 4.8, 1],
    ['豆浆', 'drink', 33, 2.4, 1.3, 2.9, 1],
    ['酸奶', 'drink', 72, 2.5, 2.7, 9.3, 1],
    ['薯片', 'snack', 536, 6.3, 35.0, 53.0, 0],
    ['黑巧克力', 'snack', 546, 4.9, 31.3, 61.0, 0],
  ]
  const insertMany = db.transaction((items) => {
    for (const f of items) insertFood.run(...f)
  })
  insertMany(foods)
}

module.exports = db


