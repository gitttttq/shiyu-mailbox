/**
 * 管理员路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { success, fail } = require('../utils/response');
const { verifyAdminKey } = require('../middleware/auth');

// 所有管理员路由都需要验证管理员密钥
router.use(verifyAdminKey);

/**
 * GET /api/admin/overview
 * 获取管理后台概览数据
 */
router.get('/overview', (req, res) => {
  try {
    const userStats = db.prepare('SELECT COUNT(*) as total FROM users').get();
    const postStats = db.prepare('SELECT status, COUNT(*) as count FROM posts GROUP BY status').all();
    
    const totals = {
      users: userStats.total,
      posts: 0,
      approved: 0,
      pending: 0,
      hidden: 0
    };
    
    postStats.forEach(item => {
      totals.posts += item.count;
      if (item.status === 'approved') totals.approved = item.count;
      if (item.status === 'pending') totals.pending = item.count;
      if (item.status === 'hidden') totals.hidden = item.count;
    });
    
    success(res, { totals });
  } catch (error) {
    console.error('获取概览数据失败:', error);
    fail(res, '获取概览数据失败', 500);
  }
});

/**
 * GET /api/admin/posts
 * 获取信件列表（支持筛选）
 */
router.get('/posts', (req, res) => {
  try {
    const { status, mood, keyword, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT * FROM posts WHERE 1=1';
    const params = [];
    
    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (mood && mood !== 'all') {
      query += ' AND mood = ?';
      params.push(mood);
    }
    
    if (keyword) {
      query += ' AND (title LIKE ? OR content LIKE ? OR nickname LIKE ?)';
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const posts = db.prepare(query).all(...params);
    
    success(res, {
      posts: posts.map(formatPost)
    });
  } catch (error) {
    console.error('获取信件列表失败:', error);
    fail(res, '获取信件列表失败', 500);
  }
});

/**
 * PUT /api/admin/posts/:id/status
 * 更新信件状态
 */
router.put('/posts/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'hidden'].includes(status)) {
      return fail(res, '无效的状态值', 400);
    }
    
    const result = db.prepare('UPDATE posts SET status = ? WHERE id = ?').run(status, id);
    
    if (result.changes === 0) {
      return fail(res, '信件不存在', 404);
    }
    
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    
    success(res, {
      post: formatPost(post)
    }, '状态更新成功');
  } catch (error) {
    console.error('更新信件状态失败:', error);
    fail(res, '更新信件状态失败', 500);
  }
});

/**
 * DELETE /api/admin/posts/:id
 * 删除信件
 */
router.delete('/posts/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      return fail(res, '信件不存在', 404);
    }
    
    success(res, null, '删除成功');
  } catch (error) {
    console.error('删除信件失败:', error);
    fail(res, '删除信件失败', 500);
  }
});

/**
 * GET /api/admin/users
 * 获取用户列表
 */
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.*,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT CASE WHEN p.status = 'pending' THEN p.id END) as pending_count,
        COUNT(DISTINCT CASE WHEN p.status = 'approved' THEN p.id END) as approved_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.author_id
      GROUP BY u.id
      ORDER BY u.last_active_at DESC
    `).all();
    
    success(res, {
      users: users.map(user => ({
        id: user.id,
        openid: user.openid,
        nickname: user.nickname,
        createdAt: user.created_at,
        lastActiveAt: user.last_active_at,
        postCount: user.post_count,
        pendingCount: user.pending_count,
        approvedCount: user.approved_count
      }))
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    fail(res, '获取用户列表失败', 500);
  }
});

/**
 * 格式化信件数据
 */
function formatPost(post) {
  return {
    id: post.id,
    authorId: post.author_id,
    openid: post.openid,
    nickname: post.nickname,
    title: post.title,
    mood: post.mood,
    content: post.content,
    status: post.status,
    pickedCount: post.picked_count,
    createdAt: post.created_at,
    updatedAt: post.updated_at
  };
}

module.exports = router;
