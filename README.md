# 时语信箱

一个基于 uni-app + 微信云开发 的微信小程序项目。

## 项目结构

```
shiyu-mailbox/
├── frontend/                # 前端（uni-app + Vue 2）
│   ├── src/
│   ├── dist/build/mp-weixin # 小程序构建产物
│   └── cloudfunctions/      # 微信云函数
└── README.md
```

## 快速开始（云开发）

### 1. 安装依赖并构建小程序

```bash
cd frontend
npm install
npm run build:mp-weixin
```

### 2. 使用微信开发者工具导入

导入目录请选：`frontend`

项目配置已指定：
- `miniprogramRoot`: `dist/build/mp-weixin`
- `cloudfunctionRoot`: `cloudfunctions`

### 3. 部署云函数

在微信开发者工具中：
1. 找到 `cloudfunctions/treehole`
2. 右键 -> `上传并部署：云端安装依赖`

### 4. 初始化数据库

在云开发数据库中创建集合：
- `users`
- `posts`
- `picks`

### 5. 初始化演示数据（可选）

在云函数 `treehole` 测试里执行：

```json
{
  "action": "seedDemo",
  "data": {
    "key": "shiyu-admin-2026"
  }
}
```

## 技术栈

- 前端：uni-app + Vue 2 + TypeScript
- 云端：微信云开发（云函数 + 云数据库）

## 说明

- 管理后台默认口令：`shiyu-admin-2026`
- 可通过云函数环境变量 `ADMIN_KEY` 覆盖默认口令
