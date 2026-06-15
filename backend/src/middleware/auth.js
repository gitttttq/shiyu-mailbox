/**
 * 管理员认证中间件
 */
const jwt = require('jsonwebtoken');

// 验证管理员密钥
function verifyAdminKey(req, res, next) {
  const adminKey = req.headers['x-admin-key'] || req.body.key;
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      ok: false,
      message: '管理员密钥错误'
    });
  }
  
  next();
}

// 验证 JWT Token（可选，用于更安全的认证）
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      ok: false,
      message: '未提供认证令牌'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      message: '认证令牌无效或已过期'
    });
  }
}

module.exports = {
  verifyAdminKey,
  verifyToken
};
