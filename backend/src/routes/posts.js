/**
 * 信件/树洞路由
 */
const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const { success, fail } = require('../utils/response');

/**
 * GET /api/posts/home
 * 获取首页数据（统计 + 最新公开信件）
 */
router.get('/home', (req, res) => {
  try {
    // 获取统计数据
    const userStats = db.prepare('SELECT COUNT(*) as total FROM users').get();
    const postStats = db.prepare('SELECT status, COUNT(*) as count FROM posts GROUP BY status').all();
    const moodStats = db.prepare('SELECT mood, COUNT(*) as count FROM posts WHERE status = ? GROUP BY mood').all('approved');
    
    // 获取最新公开信件
    const posts = db.prepare(
      `SELECT p.*, u.nickname as author_nickname 
       FROM posts p 
       LEFT JOIN users u ON p.author_id = u.id 
       WHERE p.status = ? 
       ORDER BY p.created_at DESC 
       LIMIT 20`
    ).all('approved');
    
    // 计算总拾取次数
    const pickedCount = posts.reduce((sum, post) => sum + (post.picked_count || 0), 0);
    
    // 整理情绪统计
    const moods = {};
    moodStats.forEach(item => {
      moods[item.mood] = item.count;
    });
    
    // 整理状态统计
    const stats = {
      users: userStats.total,
      approvedPosts: 0,
      pendingPosts: 0,
      pickedCount,
      moods
    };
    
    postStats.forEach(item => {
      if (item.status === 'approved') stats.approvedPosts = item.count;
      if (item.status === 'pending') stats.pendingPosts = item.count;
    });
    
    success(res, {
      stats,
      posts: posts.map(formatPost)
    });
  } catch (error) {
    console.error('获取首页数据失败:', error);
    fail(res, '获取首页数据失败', 500);
  }
});

/**
 * GET /api/posts/random
 * 随机获取一封公开信件
 */
router.get('/random', (req, res) => {
  try {
    const { excludeOpenid } = req.query;
    
    let query = 'SELECT * FROM posts WHERE status = ?';
    const params = ['approved'];
    
    if (excludeOpenid) {
      query += ' AND openid != ?';
      params.push(excludeOpenid);
    }
    
    query += ' ORDER BY RANDOM() LIMIT 1';
    
    const post = db.prepare(query).get(...params);
    
    success(res, {
      post: post ? formatPost(post) : null
    });
  } catch (error) {
    console.error('随机获取信件失败:', error);
    fail(res, '随机获取信件失败', 500);
  }
});

/**
 * POST /api/posts
 * 创建新信件
 */
router.post('/', (req, res) => {
  try {
    const { openid, nickname, title, mood, content } = req.body;
    
    if (!openid || !title || !content) {
      return fail(res, '缺少必要参数', 400);
    }
    
    // 确保用户存在
    const user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
    let userId;
    
    if (!user) {
      // 创建新用户
      const result = db.prepare('INSERT INTO users (openid, nickname) VALUES (?, ?)')
        .run(openid, nickname || '匿名来信者');
      userId = result.lastInsertRowid;
    } else {
      userId = user.id;
    }
    
    // 创建信件
    const result = db.prepare(
      `INSERT INTO posts (author_id, openid, nickname, title, mood, content, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, openid, nickname || '匿名来信者', title, mood || '未分类', content, 'pending');
    
    // 获取创建的信件
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
    
    success(res, {
      post: formatPost(post)
    }, '投稿成功，等待审核');
  } catch (error) {
    console.error('创建信件失败:', error);
    fail(res, '创建信件失败', 500);
  }
});

/**
 * GET /api/posts/mine/:openid
 * 获取用户的信件列表
 */
router.get('/mine/:openid', (req, res) => {
  try {
    const { openid } = req.params;
    
    // 获取用户信息
    const user = db.prepare('SELECT * FROM users WHERE openid = ?').get(openid);
    if (!user) {
      return fail(res, '用户不存在', 404);
    }
    
    // 获取用户的信件
    const posts = db.prepare('SELECT * FROM posts WHERE openid = ? ORDER BY created_at DESC').all(openid);
    
    success(res, {
      user,
      posts: posts.map(formatPost)
    });
  } catch (error) {
    console.error('获取用户信件失败:', error);
    fail(res, '获取用户信件失败', 500);
  }
});

/**
 * POST /api/posts/:id/pick
 * 拾取信件
 */
router.post('/:id/pick', (req, res) => {
  try {
    const { id } = req.params;
    const { openid } = req.body;
    
    if (!openid) {
      return fail(res, '缺少用户标识', 400);
    }
    
    // 检查信件是否存在且公开
    const post = db.prepare('SELECT * FROM posts WHERE id = ? AND status = ?').get(id, 'approved');
    
    if (!post) {
      return fail(res, '信件不存在或不可见', 404);
    }
    
    // 检查是否已经拾取过
    const existingPick = db.prepare('SELECT * FROM picks WHERE openid = ? AND post_id = ?').get(openid, id);
    
    if (existingPick) {
      return success(res, {
        post: formatPost(post)
      }, '你已经捡起过这封心事了');
    }
    
    // 记录拾取
    db.prepare('INSERT INTO picks (openid, post_id) VALUES (?, ?)').run(openid, id);
    
    // 更新拾取次数
    db.prepare('UPDATE posts SET picked_count = picked_count + 1 WHERE id = ?').run(id);
    
    // 获取更新后的信件
    const updatedPost = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
    
    success(res, {
      post: formatPost(updatedPost)
    }, '成功捡起这封心事');
  } catch (error) {
    console.error('拾取信件失败:', error);
    fail(res, '拾取信件失败', 500);
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
