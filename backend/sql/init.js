/**
 * 数据库初始化脚本 (SQLite 版本)
 * 运行: npm run db:init
 */
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function initDatabase() {
  // 确保 data 目录存在
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/shiyu.db');
  const db = new Database(dbPath);

  try {
    console.log('📦 开始初始化数据库...');
    
    const sqlFile = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    
    // 执行整个 SQL 文件
    db.exec(sqlFile);

    console.log('✅ 数据库初始化完成！');
    console.log('📊 已创建表: users, posts, picks');
    console.log('🌱 已插入示例数据');
    console.log(`📁 数据库文件: ${dbPath}`);
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

initDatabase();
