const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.SHIYU_API_PORT || 3007);
const ADMIN_KEY = process.env.SHIYU_ADMIN_KEY || 'shiyu-admin-2026';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'shiyu-db.json');

function now() {
  return new Date().toISOString();
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    return;
  }

  const seededAt = now();
  const seed = {
    meta: {
      version: 1,
      seededAt,
      adminKeyHint: 'Use SHIYU_ADMIN_KEY env or default shiyu-admin-2026 for local admin access.'
    },
    users: [
      {
        id: 'user-seed-1',
        nickname: '晚风小姐',
        createdAt: seededAt,
        lastActiveAt: seededAt
      },
      {
        id: 'user-seed-2',
        nickname: '山茶',
        createdAt: seededAt,
        lastActiveAt: seededAt
      }
    ],
    posts: [
      {
        id: 'post-seed-1',
        authorId: 'user-seed-1',
        nickname: '晚风小姐',
        title: '雨停之后，路灯也变得温柔',
        mood: '治愈',
        content: '傍晚经过街角花店的时候，忽然觉得日子并不是要被赶着走完，而是要一朵一朵地闻过去。',
        status: 'approved',
        pickedCount: 3,
        createdAt: seededAt,
        updatedAt: seededAt
      },
      {
        id: 'post-seed-2',
        authorId: 'user-seed-2',
        nickname: '山茶',
        title: '给那个迟迟不敢出发的自己',
        mood: '勇气',
        content: '害怕没有关系，慢一点也没有关系。真正重要的，是你终于愿意把第一步交给自己。',
        status: 'approved',
        pickedCount: 2,
        createdAt: seededAt,
        updatedAt: seededAt
      }
    ],
    picks: []
  };

  fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2));
}

function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sortByCreatedDesc(list) {
  return [...list].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

function summarizeMoods(posts) {
  return posts.reduce((summary, post) => {
    summary[post.mood] = (summary[post.mood] || 0) + 1;
    return summary;
  }, {});
}

function serializePost(post) {
  return {
    id: post.id,
    authorId: post.authorId,
    nickname: post.nickname,
    title: post.title,
    mood: post.mood,
    content: post.content,
    status: post.status,
    pickedCount: post.pickedCount || 0,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-key',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS'
  });
  res.end(JSON.stringify(payload));
}

function notFound(res) {
  sendJson(res, 404, { message: 'Not Found' });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function isAdmin(req, query, body) {
  const key = req.headers['x-admin-key'] || query.key || body.key;
  return key === ADMIN_KEY;
}

function upsertUser(db, userId, nickname) {
  const trimmedNickname = (nickname || '匿名来信者').trim() || '匿名来信者';
  let user = db.users.find(item => item.id === userId);

  if (!user) {
    user = {
      id: userId || randomUUID(),
      nickname: trimmedNickname,
      createdAt: now(),
      lastActiveAt: now()
    };
    db.users.unshift(user);
  } else {
    user.nickname = trimmedNickname;
    user.lastActiveAt = now();
  }

  return user;
}

function safeTrim(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function matchRoute(pathname, pattern) {
  const matched = pathname.match(pattern);
  return matched ? matched.slice(1) : null;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, { ok: true, port: PORT, time: now() });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/stats') {
    const db = readDb();
    const approvedPosts = db.posts.filter(item => item.status === 'approved');
    const pickedCount = db.posts.reduce((sum, item) => sum + (item.pickedCount || 0), 0);
    sendJson(res, 200, {
      users: db.users.length,
      approvedPosts: approvedPosts.length,
      pendingPosts: db.posts.filter(item => item.status === 'pending').length,
      pickedCount,
      moods: summarizeMoods(approvedPosts),
      latestPosts: sortByCreatedDesc(approvedPosts).slice(0, 6).map(serializePost)
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/posts') {
    const db = readDb();
    const query = Object.fromEntries(url.searchParams.entries());
    const mood = query.mood || 'all';
    const status = query.status || 'approved';
    const limit = Number(query.limit || 20);
    const posts = sortByCreatedDesc(
      db.posts.filter(post => {
        const moodMatch = mood === 'all' || post.mood === mood;
        const statusMatch = status === 'all' || post.status === status;
        return moodMatch && statusMatch;
      })
    ).slice(0, limit);

    sendJson(res, 200, {
      posts: posts.map(serializePost)
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/users/identify') {
    try {
      const db = readDb();
      const body = await parseBody(req);
      const user = upsertUser(db, body.userId || randomUUID(), body.nickname);
      writeDb(db);
      sendJson(res, 200, { user });
    } catch (error) {
      sendJson(res, 400, { message: 'Invalid JSON body' });
    }
    return;
  }

  if (req.method === 'POST' && pathname === '/api/posts') {
    try {
      const db = readDb();
      const body = await parseBody(req);
      const nickname = safeTrim(body.nickname, 20) || '匿名来信者';
      const title = safeTrim(body.title, 40);
      const content = safeTrim(body.content, 300);
      const mood = safeTrim(body.mood, 10) || '未分类';

      if (!title || !content) {
        sendJson(res, 422, { message: 'Title and content are required.' });
        return;
      }

      const user = upsertUser(db, body.authorId || randomUUID(), nickname);
      const createdAt = now();
      const post = {
        id: randomUUID(),
        authorId: user.id,
        nickname: user.nickname,
        title,
        mood,
        content,
        status: 'pending',
        pickedCount: 0,
        createdAt,
        updatedAt: createdAt
      };

      db.posts.unshift(post);
      writeDb(db);
      sendJson(res, 201, {
        message: '投稿成功，等待管理员审核后会出现在公共树洞里。',
        post: serializePost(post),
        user
      });
    } catch (error) {
      sendJson(res, 400, { message: 'Invalid JSON body' });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/posts/random') {
    const db = readDb();
    const query = Object.fromEntries(url.searchParams.entries());
    const excludeAuthorId = query.excludeAuthorId;
    const candidates = db.posts.filter(post => {
      return post.status === 'approved' && post.authorId !== excludeAuthorId;
    });

    if (!candidates.length) {
      sendJson(res, 200, { post: null, message: '暂时还没有可捡起的心事。' });
      return;
    }

    const post = candidates[Math.floor(Math.random() * candidates.length)];
    sendJson(res, 200, { post: serializePost(post) });
    return;
  }

  const userPostsMatch = matchRoute(pathname, /^\/api\/users\/([^/]+)\/posts$/);
  if (req.method === 'GET' && userPostsMatch) {
    const [userId] = userPostsMatch;
    const db = readDb();
    const user = db.users.find(item => item.id === userId);
    const posts = sortByCreatedDesc(db.posts.filter(item => item.authorId === userId));
    sendJson(res, 200, {
      user: user || null,
      posts: posts.map(serializePost)
    });
    return;
  }

  const pickMatch = matchRoute(pathname, /^\/api\/posts\/([^/]+)\/pick$/);
  if (req.method === 'POST' && pickMatch) {
    try {
      const [postId] = pickMatch;
      const db = readDb();
      const body = await parseBody(req);
      const post = db.posts.find(item => item.id === postId && item.status === 'approved');
      if (!post) {
        sendJson(res, 404, { message: '这封信已经找不到了。' });
        return;
      }

      const picker = upsertUser(db, body.pickerId || randomUUID(), body.nickname || '拾语旅人');
      post.pickedCount = (post.pickedCount || 0) + 1;
      post.updatedAt = now();
      db.picks.unshift({
        id: randomUUID(),
        postId,
        pickerId: picker.id,
        createdAt: now()
      });
      writeDb(db);
      sendJson(res, 200, {
        message: '你已经捡起这封心事。',
        post: serializePost(post)
      });
    } catch (error) {
      sendJson(res, 400, { message: 'Invalid JSON body' });
    }
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/overview') {
    const query = Object.fromEntries(url.searchParams.entries());
    if (!isAdmin(req, query, {})) {
      sendJson(res, 401, { message: 'Unauthorized' });
      return;
    }

    const db = readDb();
    sendJson(res, 200, {
      totals: {
        users: db.users.length,
        posts: db.posts.length,
        approved: db.posts.filter(item => item.status === 'approved').length,
        pending: db.posts.filter(item => item.status === 'pending').length,
        hidden: db.posts.filter(item => item.status === 'hidden').length
      },
      adminKeyHint: db.meta.adminKeyHint
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/posts') {
    const query = Object.fromEntries(url.searchParams.entries());
    if (!isAdmin(req, query, {})) {
      sendJson(res, 401, { message: 'Unauthorized' });
      return;
    }

    const db = readDb();
    const status = query.status || 'all';
    const mood = query.mood || 'all';
    const keyword = safeTrim(query.keyword, 60).toLowerCase();

    const posts = sortByCreatedDesc(db.posts.filter(post => {
      const statusMatch = status === 'all' || post.status === status;
      const moodMatch = mood === 'all' || post.mood === mood;
      const keywordMatch = !keyword || [post.title, post.content, post.nickname].join(' ').toLowerCase().includes(keyword);
      return statusMatch && moodMatch && keywordMatch;
    }));

    sendJson(res, 200, {
      posts: posts.map(serializePost)
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/admin/users') {
    const query = Object.fromEntries(url.searchParams.entries());
    if (!isAdmin(req, query, {})) {
      sendJson(res, 401, { message: 'Unauthorized' });
      return;
    }

    const db = readDb();
    const users = db.users.map(user => {
      const posts = db.posts.filter(item => item.authorId === user.id);
      return {
        ...user,
        postCount: posts.length,
        approvedCount: posts.filter(item => item.status === 'approved').length,
        pendingCount: posts.filter(item => item.status === 'pending').length
      };
    }).sort((left, right) => new Date(right.lastActiveAt).getTime() - new Date(left.lastActiveAt).getTime());

    sendJson(res, 200, { users });
    return;
  }

  const adminStatusMatch = matchRoute(pathname, /^\/api\/admin\/posts\/([^/]+)\/status$/);
  if (req.method === 'PATCH' && adminStatusMatch) {
    try {
      const [postId] = adminStatusMatch;
      const body = await parseBody(req);
      const query = Object.fromEntries(url.searchParams.entries());
      if (!isAdmin(req, query, body)) {
        sendJson(res, 401, { message: 'Unauthorized' });
        return;
      }

      if (!['pending', 'approved', 'hidden'].includes(body.status)) {
        sendJson(res, 422, { message: 'Unsupported status value.' });
        return;
      }

      const db = readDb();
      const post = db.posts.find(item => item.id === postId);
      if (!post) {
        sendJson(res, 404, { message: 'Post not found.' });
        return;
      }

      post.status = body.status;
      post.updatedAt = now();
      writeDb(db);
      sendJson(res, 200, {
        message: '状态已更新。',
        post: serializePost(post)
      });
    } catch (error) {
      sendJson(res, 400, { message: 'Invalid JSON body' });
    }
    return;
  }

  notFound(res);
});

ensureDb();
server.listen(PORT, () => {
  console.log(`[shiyu-api] listening on http://127.0.0.1:${PORT}`);
});