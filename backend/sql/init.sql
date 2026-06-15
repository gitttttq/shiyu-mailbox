-- 时语信箱数据库初始化脚本 (SQLite 版本)

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid VARCHAR(100) UNIQUE NOT NULL, -- 微信用户唯一标识
  nickname VARCHAR(50) DEFAULT '匿名来信者', -- 用户昵称
  avatar_url VARCHAR(500) DEFAULT '', -- 头像URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP -- 最后活跃时间
);

-- 信件/树洞表
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL, -- 作者ID
  openid VARCHAR(100) NOT NULL, -- 作者openid（冗余字段，方便查询）
  nickname VARCHAR(50) NOT NULL, -- 显示昵称
  title VARCHAR(100) NOT NULL, -- 标题
  mood VARCHAR(20) DEFAULT '未分类', -- 情绪标签
  content TEXT NOT NULL, -- 内容
  status VARCHAR(20) DEFAULT 'pending', -- 状态：pending待审核 approved已通过 hidden已隐藏
  picked_count INTEGER DEFAULT 0, -- 被捡起次数
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 创建时间
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 更新时间
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 拾取记录表
CREATE TABLE IF NOT EXISTS picks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid VARCHAR(100) NOT NULL, -- 拾取者openid
  post_id INTEGER NOT NULL, -- 信件ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- 拾取时间
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE(openid, post_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_openid ON posts(openid);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_mood ON posts(mood);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_picked_count ON posts(picked_count);
CREATE INDEX IF NOT EXISTS idx_picks_openid ON picks(openid);
CREATE INDEX IF NOT EXISTS idx_picks_post_id ON picks(post_id);

-- 插入示例数据
INSERT INTO users (openid, nickname) VALUES
('user_demo_1', '晚风小姐'),
('user_demo_2', '山茶');

INSERT INTO posts (author_id, openid, nickname, title, mood, content, status, picked_count) VALUES
(1, 'user_demo_1', '晚风小姐', '雨停之后，路灯也变得温柔', '治愈', '傍晚经过街角花店的时候，忽然觉得日子并不是要被赶着走完，而是要一朵一朵地闻过去。', 'approved', 3),
(2, 'user_demo_2', '山茶', '给那个迟迟不敢出发的自己', '勇气', '害怕没有关系，慢一点也没有关系。真正重要的，是你终于愿意把第一步交给自己。', 'approved', 2);
