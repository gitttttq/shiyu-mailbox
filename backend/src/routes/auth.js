/**
 * 用户认证路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { success, fail } = require('../utils/response');

/**
 * POST /api/auth/login
 * 用户登录（微信小程序通过 wx.login 获取 code，后端换取 openid）
 */
router.post('/login', (req, res) => {
  try {
    const { code, nickname } = req.body;
    
    // 开发环境：直接使用传入的 openid 或生成一个测试 openid
    let openid;
    if (process.env.NODE_ENV === 'development' && !code) {
      openid = req.body.openid || `test_user_${Date.now()}`;
    } else {
      // TODO: 生产环境需要调用微信接口换取 openid
      // const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
      // const response = await axios.get(url);
      // openid = response.data.openid;
      openid = req.body.openid;
    }
    
    if (!openid) {
      return fail(res, '缺少用户标识', 400);
    }
    
    // 检查用户是否存在
    const existingUser = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
    
    let user;
    if (existingUser) {
      // 用户已存在，更新最后活跃时间和昵称
      user = existingUser;
      db.prepare('UPDATE users SET nickname = ?, last_active_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(nickname || user.nickname, user.id);
      user.nickname = nickname || user.nickname;
    } else {
      // 用户不存在，创建新用户
      const result = db.prepare('INSERT INTO users (openid, nickname) VALUES (?, ?)')
        .run(openid, nickname || '匿名来信者');
      user = {
        id: result.lastInsertRowid,
        openid,
        nickname: nickname || '匿名来信者'
      };
    }
    
    success(res, {
      user: {
        id: user.id,
        openid: user.openid,
        nickname: user.nickname
      }
    }, '登录成功');
  } catch (error) {
    console.error('登录失败:', error);
    fail(res, '登录失败: ' + error.message, 500);
  }
});

/**
 * GET /api/auth/user/:openid
 * 获取用户信息
 */
router.get('/user/:openid', (req, res) => {
  try {
    const { openid } = req.params;
    
    const user = db.prepare(
      'SELECT id, openid, nickname, created_at, last_active_at FROM users WHERE openid = ?'
    ).get(openid);
    
    if (!user) {
      return fail(res, '用户不存在', 404);
    }
    
    success(res, { user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    fail(res, '获取用户信息失败', 500);
  }
});

module.exports = router;
