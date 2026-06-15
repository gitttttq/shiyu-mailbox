# 时语信箱

一个基于 uni-app 的微信小程序项目，采用前后端分离架构。

## 项目结构

```
shiyu-mailbox/
├── frontend/    # 前端（uni-app + Vue 2）
├── backend/     # 后端（Node.js + Express + SQLite）
└── README.md
```

## 快速开始

### 1. 启动后端

```bash
cd backend
npm install
npm run db:init    # 初始化数据库（首次运行）
npm run dev        # 启动开发服务器
```

后端服务运行在 `http://localhost:3007`

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev:mp-weixin    # 编译到微信小程序
```

然后在微信开发者工具中打开 `frontend/dist/dev/mp-weixin` 目录。

## 技术栈

- **前端**: uni-app + Vue 2 + TypeScript
- **后端**: Node.js + Express + SQLite
- **数据库**: SQLite（本地开发）/ MySQL（生产环境）

## 开发说明

- 前端 API 请求地址：`http://localhost:3007/api`
- 后端数据库文件：`backend/data/shiyu.db`
- 管理后台密钥：`shiyu-admin-2026`（可在 `backend/.env` 修改）
