const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const $ = db.command.aggregate;

const ADMIN_KEY = process.env.ADMIN_KEY || 'shiyu-admin-2026';
const ADMIN_OPENIDS = String(process.env.ADMIN_OPENIDS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function isAdminOpenid(openid) {
  if (!openid) return false;
  return ADMIN_OPENIDS.includes(openid);
}

function nowIso() {
  return new Date().toISOString();
}

function nowTs() {
  return Date.now();
}

function success(data, message = '操作成功') {
  return { ok: true, data, message };
}

function fail(message, code = 'FAIL') {
  return { ok: false, data: null, message, code };
}

function isCollectionNotExistError(error) {
  const msg = String((error && (error.errMsg || error.message)) || '');
  return msg.includes('DATABASE_COLLECTION_NOT_EXIST') || msg.includes('Db or Table not exist');
}

function getCollectionSetupHint() {
  return '云开发数据库未初始化，请先创建集合：users、posts、picks';
}

async function ensureCollection(name) {
  if (typeof db.createCollection !== 'function') {
    return { name, status: 'unsupported' };
  }

  try {
    await db.createCollection(name);
    return { name, status: 'created' };
  } catch (error) {
    const msg = String((error && (error.errMsg || error.message)) || '');
    if (
      msg.includes('Collection already exists') ||
      msg.includes('DATABASE_COLLECTION_ALREADY_EXISTS') ||
      msg.includes('collection already exists')
    ) {
      return { name, status: 'exists' };
    }
    throw error;
  }
}

function safeTrim(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function getContextOpenid(context, fallbackOpenid) {
  const byContext = safeTrim(context && context.OPENID, 80);
  if (byContext) return byContext;

  try {
    const wxContext = cloud.getWXContext();
    const byWxContext = safeTrim(wxContext && wxContext.OPENID, 80);
    if (byWxContext) return byWxContext;
  } catch (error) {
    // ignore
  }

  return safeTrim(fallbackOpenid, 80);
}

function formatPost(post) {
  if (!post) return null;
  return {
    id: post._id,
    authorId: post.author_id,
    openid: post.openid,
    nickname: post.nickname,
    title: post.title,
    mood: post.mood,
    content: post.content,
    status: post.status,
    pickedCount: post.picked_count || 0,
    createdAt: post.created_at,
    updatedAt: post.updated_at
  };
}

async function upsertUser(openid, nickname) {
  const userOpenid = safeTrim(openid, 80);
  if (!userOpenid) {
    throw new Error('缺少用户标识');
  }

  const displayName = safeTrim(nickname, 20) || '匿名来信者';
  const userCol = db.collection('users');
  const existed = await userCol.where({ openid: userOpenid }).limit(1).get();

  if (!existed.data.length) {
    const createdAt = nowIso();
    const ts = nowTs();
    const addRes = await userCol.add({
      data: {
        openid: userOpenid,
        nickname: displayName,
        created_at: createdAt,
        created_at_ts: ts,
        last_active_at: createdAt,
        last_active_at_ts: ts
      }
    });

    const created = await userCol.doc(addRes._id).get();
    return created.data;
  }

  const user = existed.data[0];
  await userCol.doc(user._id).update({
    data: {
      nickname: displayName,
      last_active_at: nowIso(),
      last_active_at_ts: nowTs()
    }
  });

  const latest = await userCol.doc(user._id).get();
  return latest.data;
}

async function getHomeData() {
  const usersRes = await db.collection('users').count();
  const approvedCountRes = await db.collection('posts').where({ status: 'approved' }).count();
  const pendingCountRes = await db.collection('posts').where({ status: 'pending' }).count();

  const postsRes = await db.collection('posts')
    .where({ status: 'approved' })
    .orderBy('created_at_ts', 'desc')
    .limit(20)
    .get();

  const posts = postsRes.data || [];
  const pickedCount = posts.reduce((sum, post) => sum + (post.picked_count || 0), 0);

  const moodAgg = await db.collection('posts')
    .aggregate()
    .match({ status: 'approved' })
    .group({
      _id: '$mood',
      count: $.sum(1)
    })
    .end();

  const moods = {};
  (moodAgg.list || []).forEach((item) => {
    moods[item._id] = item.count;
  });

  return {
    stats: {
      users: usersRes.total,
      approvedPosts: approvedCountRes.total,
      pendingPosts: pendingCountRes.total,
      pickedCount,
      moods
    },
    posts: posts.map(formatPost)
  };
}

async function getRandomPost(data) {
  const excludeOpenid = safeTrim(data.excludeOpenid, 80);

  const where = { status: 'approved' };
  if (excludeOpenid) {
    where.openid = _.neq(excludeOpenid);
  }

  const postsRes = await db.collection('posts').where(where).get();
  const candidates = postsRes.data || [];
  if (!candidates.length) {
    return { post: null };
  }

  const idx = Math.floor(Math.random() * candidates.length);
  return { post: formatPost(candidates[idx]) };
}

async function createPost(data, context) {
  const openid = getContextOpenid(context, data.openid);
  const nickname = safeTrim(data.nickname, 20) || '匿名来信者';
  const title = safeTrim(data.title, 40);
  const mood = safeTrim(data.mood, 10) || '未分类';
  const content = safeTrim(data.content, 300);

  if (!openid || !title || !content) {
    throw new Error('缺少必要参数');
  }

  const user = await upsertUser(openid, nickname);
  const createdAt = nowIso();
  const createdAtTs = nowTs();

  const addRes = await db.collection('posts').add({
    data: {
      author_id: user._id,
      openid,
      nickname,
      title,
      mood,
      content,
      status: 'pending',
      picked_count: 0,
      created_at: createdAt,
      created_at_ts: createdAtTs,
      updated_at: createdAt,
      updated_at_ts: createdAtTs
    }
  });

  const postRes = await db.collection('posts').doc(addRes._id).get();
  return { post: formatPost(postRes.data) };
}

async function getMyPosts(data) {
  const openid = safeTrim(data.openid, 80);
  if (!openid) {
    throw new Error('缺少用户标识');
  }

  const userRes = await db.collection('users').where({ openid }).limit(1).get();
  const postRes = await db.collection('posts')
    .where({ openid })
    .orderBy('created_at_ts', 'desc')
    .get();

  const user = userRes.data[0];
  const mappedUser = user
    ? {
        id: user._id,
        openid: user.openid,
        nickname: user.nickname,
        createdAt: user.created_at,
        lastActiveAt: user.last_active_at
      }
    : null;

  return {
    user: mappedUser,
    posts: (postRes.data || []).map(formatPost)
  };
}

function assertAdmin(key) {
  if (safeTrim(key, 80) !== ADMIN_KEY) {
    throw new Error('管理员口令错误');
  }
}

async function getAdminOverview(data) {
  assertAdmin(data.key);

  const usersRes = await db.collection('users').count();
  const postsRes = await db.collection('posts').count();
  const approvedRes = await db.collection('posts').where({ status: 'approved' }).count();
  const pendingRes = await db.collection('posts').where({ status: 'pending' }).count();
  const hiddenRes = await db.collection('posts').where({ status: 'hidden' }).count();

  return {
    totals: {
      users: usersRes.total,
      posts: postsRes.total,
      approved: approvedRes.total,
      pending: pendingRes.total,
      hidden: hiddenRes.total
    }
  };
}

async function getAdminPosts(data) {
  assertAdmin(data.key);

  const status = safeTrim(data.status, 20) || 'all';
  const mood = safeTrim(data.mood, 20) || 'all';
  const keyword = safeTrim(data.keyword, 60).toLowerCase();

  const where = {};
  if (status !== 'all') where.status = status;
  if (mood !== 'all') where.mood = mood;

  const res = await db.collection('posts').where(where).orderBy('created_at_ts', 'desc').get();
  let posts = res.data || [];

  if (keyword) {
    posts = posts.filter((post) => {
      const text = `${post.title || ''} ${post.content || ''} ${post.nickname || ''}`.toLowerCase();
      return text.includes(keyword);
    });
  }

  return { posts: posts.map(formatPost) };
}

async function getAdminUsers(data) {
  assertAdmin(data.key);

  const usersRes = await db.collection('users').orderBy('last_active_at_ts', 'desc').get();
  const postsRes = await db.collection('posts').get();

  const posts = postsRes.data || [];
  const users = (usersRes.data || []).map((user) => {
    const mine = posts.filter((post) => post.author_id === user._id);
    return {
      id: user._id,
      openid: user.openid,
      nickname: user.nickname,
      createdAt: user.created_at,
      lastActiveAt: user.last_active_at,
      postCount: mine.length,
      approvedCount: mine.filter((item) => item.status === 'approved').length,
      pendingCount: mine.filter((item) => item.status === 'pending').length
    };
  });

  return { users };
}

async function updatePostStatus(data) {
  assertAdmin(data.key);

  const postId = safeTrim(data.postId, 80);
  const status = safeTrim(data.status, 20);
  if (!postId || !['pending', 'approved', 'hidden'].includes(status)) {
    throw new Error('参数不合法');
  }

  await db.collection('posts').doc(postId).update({
    data: {
      status,
      updated_at: nowIso(),
      updated_at_ts: nowTs()
    }
  });

  const res = await db.collection('posts').doc(postId).get();
  return { post: formatPost(res.data) };
}

async function pickPost(data, context) {
  const postId = safeTrim(data.postId, 80);
  const openid = getContextOpenid(context, data.openid);

  if (!postId || !openid) {
    throw new Error('缺少必要参数');
  }

  const user = await upsertUser(openid, '拾语旅人');
  const postRes = await db.collection('posts').doc(postId).get();
  const post = postRes.data;

  if (!post || post.status !== 'approved') {
    throw new Error('信件不存在或不可见');
  }

  const pickedRes = await db.collection('picks').where({ openid, post_id: postId }).limit(1).get();
  if (pickedRes.data.length) {
    return { post: formatPost(post) };
  }

  await db.collection('picks').add({
    data: {
      openid,
      post_id: postId,
      picker_id: user._id,
      created_at: nowIso(),
      created_at_ts: nowTs()
    }
  });

  await db.collection('posts').doc(postId).update({
    data: {
      picked_count: (post.picked_count || 0) + 1,
      updated_at: nowIso(),
      updated_at_ts: nowTs()
    }
  });

  const latest = await db.collection('posts').doc(postId).get();
  return { post: formatPost(latest.data) };
}

async function seedDemo(data) {
  assertAdmin(data.key);

  const force = !!data.force;
  const postsCount = await db.collection('posts').count();

  if (postsCount.total > 0 && !force) {
    return {
      inserted: false,
      message: '已有数据，跳过初始化。可传 force=true 强制追加示例数据。',
      totals: {
        posts: postsCount.total
      }
    };
  }

  const seededAt = nowIso();
  const seededTs = nowTs();

  const userCol = db.collection('users');
  const postCol = db.collection('posts');

  async function ensureUser(openid, nickname) {
    const existed = await userCol.where({ openid }).limit(1).get();
    if (existed.data.length) {
      return existed.data[0];
    }

    const addRes = await userCol.add({
      data: {
        openid,
        nickname,
        created_at: seededAt,
        created_at_ts: seededTs,
        last_active_at: seededAt,
        last_active_at_ts: seededTs
      }
    });

    const created = await userCol.doc(addRes._id).get();
    return created.data;
  }

  const user1 = await ensureUser('user_demo_1', '晚风小姐');
  const user2 = await ensureUser('user_demo_2', '山茶');

  const demoPosts = [
    {
      author_id: user1._id,
      openid: 'user_demo_1',
      nickname: '晚风小姐',
      title: '雨停之后，路灯也变得温柔',
      mood: '治愈',
      content: '傍晚经过街角花店的时候，忽然觉得日子并不是要被赶着走完，而是要一朵一朵地闻过去。',
      status: 'approved',
      picked_count: 3,
      created_at: seededAt,
      created_at_ts: seededTs,
      updated_at: seededAt,
      updated_at_ts: seededTs
    },
    {
      author_id: user2._id,
      openid: 'user_demo_2',
      nickname: '山茶',
      title: '给那个迟迟不敢出发的自己',
      mood: '勇气',
      content: '害怕没有关系，慢一点也没有关系。真正重要的，是你终于愿意把第一步交给自己。',
      status: 'approved',
      picked_count: 2,
      created_at: seededAt,
      created_at_ts: seededTs + 1,
      updated_at: seededAt,
      updated_at_ts: seededTs + 1
    }
  ];

  for (const post of demoPosts) {
    // 避免重复插入同名示例
    const existed = await postCol.where({ title: post.title }).limit(1).get();
    if (!existed.data.length || force) {
      await postCol.add({ data: post });
    }
  }

  const latestPosts = await postCol.count();
  return {
    inserted: true,
    message: '示例数据初始化完成。',
    totals: {
      posts: latestPosts.total
    }
  };
}

async function initAll(data) {
  assertAdmin(data.key);

  const collections = ['users', 'posts', 'picks'];
  const collectionResults = [];

  for (const name of collections) {
    const result = await ensureCollection(name);
    collectionResults.push(result);
  }

  const seedResult = await seedDemo({ key: data.key, force: !!data.force });

  return {
    message: '初始化完成',
    collections: collectionResults,
    seed: seedResult
  };
}

async function getViewer(context) {
  const openid = getContextOpenid(context);
  return {
    openid,
    isAdmin: isAdminOpenid(openid)
  };
}

exports.main = async (event, context) => {
  const action = event.action;
  const data = event.data || {};

  try {
    switch (action) {
      case 'home':
        return success(await getHomeData());
      case 'random':
        return success(await getRandomPost(data));
      case 'createPost':
        return success(await createPost(data, context));
      case 'myPosts':
        return success(await getMyPosts(data));
      case 'pick':
        return success(await pickPost(data, context));
      case 'adminOverview':
        return success(await getAdminOverview(data));
      case 'adminPosts':
        return success(await getAdminPosts(data));
      case 'adminUsers':
        return success(await getAdminUsers(data));
      case 'updatePostStatus':
        return success(await updatePostStatus(data));
      case 'seedDemo':
        return success(await seedDemo(data));
      case 'initAll':
        return success(await initAll(data));
      case 'viewer':
        return success(await getViewer(context));
      default:
        return fail('未知操作类型');
    }
  } catch (error) {
    if (isCollectionNotExistError(error)) {
      // 读操作在数据库未初始化时返回空数据，保证页面可继续使用。
      if (action === 'home') {
        return success({
          stats: {
            users: 0,
            approvedPosts: 0,
            pendingPosts: 0,
            pickedCount: 0,
            moods: {}
          },
          posts: []
        }, '数据库尚未初始化，当前返回空数据');
      }

      if (action === 'random') {
        return success({ post: null }, '数据库尚未初始化，当前返回空数据');
      }

      if (action === 'myPosts') {
        return success({ user: null, posts: [] }, '数据库尚未初始化，当前返回空数据');
      }

      if (action === 'adminOverview') {
        return success({
          totals: {
            users: 0,
            posts: 0,
            approved: 0,
            pending: 0,
            hidden: 0
          }
        }, '数据库尚未初始化，当前返回空数据');
      }

      if (action === 'adminPosts') {
        return success({ posts: [] }, '数据库尚未初始化，当前返回空数据');
      }

      if (action === 'adminUsers') {
        return success({ users: [] }, '数据库尚未初始化，当前返回空数据');
      }

      return fail(getCollectionSetupHint(), 'DATABASE_NOT_READY');
    }

    return fail(error.message || '云函数执行失败');
  }
};
