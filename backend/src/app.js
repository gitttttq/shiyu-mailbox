/**
 * 时语信箱后端主应用
 * Node.js + Express + SQLite
 */
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { testConnection } = require('./config/database');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3007;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP最多100次请求
  message: {
    ok: false,
    message: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    message: '时语信箱后端服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    ok: false,
    message: '接口不存在'
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    ok: false,
    message: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
});

// 启动服务器
function startServer() {
  // 测试数据库连接
  const dbConnected = testConnection();
  if (!dbConnected) {
    console.error('❌ 数据库连接失败，请检查配置');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌳 时语信箱后端服务已启动                                ║
║                                                           ║
║   📡 服务地址: http://localhost:${PORT}                    ║
║   🔧 环境: ${process.env.NODE_ENV || 'development'}                              ║
║   📊 数据库: SQLite                                        ║
║                                                           ║
║   API 路由:                                               ║
║   - POST   /api/auth/login          用户登录              ║
║   - GET    /api/posts/home          首页数据              ║
║   - GET    /api/posts/random        随机信件              ║
║   - POST   /api/posts              创建信件              ║
║   - GET    /api/posts/mine/:openid  我的信件              ║
║   - POST   /api/posts/:id/pick     拾取信件              ║
║   - GET    /api/admin/overview      管理概览              ║
║   - GET    /api/admin/posts        信件列表              ║
║   - PUT    /api/admin/posts/:id/status  更新状态          ║
║   - GET    /api/admin/users        用户列表              ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();

module.exports = app;
