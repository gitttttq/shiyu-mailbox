const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// SQLite 数据库文件路径（始终相对于 backend 目录）
const dbPath = process.env.DB_PATH
  ? path.resolve(__dirname, '../../', process.env.DB_PATH)
  : path.join(__dirname, '../../data/shiyu.db');

// 创建数据库连接
const db = new Database(dbPath);

// 启用 WAL 模式（提高并发性能）
db.pragma('journal_mode = WAL');

// 测试连接
function testConnection() {
  try {
    db.exec('SELECT 1');
    console.log('✅ SQLite 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ SQLite 数据库连接失败:', error.message);
    return false;
  }
}

module.exports = {
  db,
  testConnection
};
