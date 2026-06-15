# 时语信箱后端部署指南

## 📋 系统要求

- Node.js 16+ 
- MySQL 5.7+ 或 8.0+
- Nginx（用于反向代理和 HTTPS）
- PM2（用于进程管理）

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=shiyu_mailbox

# 管理员密钥
ADMIN_KEY=shiyu-admin-2026

# JWT 密钥（生产环境请修改）
JWT_SECRET=your_jwt_secret_key_change_this_in_production

# 微信小程序配置（可选）
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret
```

### 3. 初始化数据库

```bash
npm run db:init
```

这会：
- 创建 `shiyu_mailbox` 数据库
- 创建 `users`、`posts`、`picks` 三张表
- 插入示例数据

### 4. 启动服务

**开发环境：**
```bash
npm run dev
```

**生产环境：**
```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs shiyu-mailbox-api
```

## 🔧 Nginx 配置

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

### 2. 配置 SSL 证书（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d api.yourdomain.com
```

### 3. 配置 Nginx

```bash
# 复制配置示例
sudo cp nginx.conf.example /etc/nginx/conf.d/shiyu-mailbox.conf

# 编辑配置，替换域名
sudo nano /etc/nginx/conf.d/shiyu-mailbox.conf

# 测试配置
sudo nginx -t

# 重载 Nginx
sudo systemctl reload nginx
```

## 📱 微信小程序配置

### 1. 配置服务器域名

在微信公众平台 → 开发管理 → 开发设置 → 服务器域名：

- request 合法域名：`https://api.yourdomain.com`

### 2. 更新前端配置

修改 `src/utils/treehole.ts` 中的 `API_BASE_URL`：

```typescript
const API_BASE_URL = 'https://api.yourdomain.com/api';
```

## 🔐 安全建议

1. **修改默认管理员密钥**
   - 编辑 `.env` 文件中的 `ADMIN_KEY`

2. **配置防火墙**
   ```bash
   # 只开放必要端口
   sudo ufw allow 22/tcp    # SSH
   sudo ufw allow 80/tcp    # HTTP
   sudo ufw allow 443/tcp   # HTTPS
   sudo ufw enable
   ```

3. **MySQL 安全**
   - 创建专用数据库用户（不要使用 root）
   - 限制用户权限

4. **定期备份数据库**
   ```bash
   mysqldump -u root -p shiyu_mailbox > backup_$(date +%Y%m%d).sql
   ```

## 📊 监控和维护

### PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs shiyu-mailbox-api

# 重启服务
pm2 restart shiyu-mailbox-api

# 停止服务
pm2 stop shiyu-mailbox-api

# 设置开机启动
pm2 startup
pm2 save
```

### 日志查看

```bash
# 应用日志
tail -f logs/pm2-out.log
tail -f logs/pm2-error.log

# Nginx 日志
tail -f /var/log/nginx/shiyu-mailbox-access.log
tail -f /var/log/nginx/shiyu-mailbox-error.log
```

## 🐛 常见问题

### 1. 数据库连接失败

检查：
- MySQL 服务是否启动：`sudo systemctl status mysql`
- 数据库用户权限是否正确
- `.env` 配置是否正确

### 2. 端口被占用

修改 `.env` 中的 `PORT` 或释放端口：
```bash
# 查看占用端口的进程
sudo lsof -i :3007

# 杀死进程
sudo kill -9 <PID>
```

### 3. CORS 错误

检查 `.env` 中的 `CORS_ORIGIN` 配置，确保包含前端域名。

## 📞 技术支持

如有问题，请检查：
1. PM2 日志：`pm2 logs`
2. Nginx 日志：`/var/log/nginx/`
3. MySQL 日志：`/var/log/mysql/`
