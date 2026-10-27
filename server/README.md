# 后端说明：登录注册与私信模块

> 对应分工表第 1 项（张三 · feature/zhangsan-auth），面向其他成员提供统一接口。
> 技术栈：Node.js + Express + MySQL，无 AI。

## 目录结构

```
server/
├── app.js                  # 服务入口
├── config/db.js            # MySQL 连接池
├── controllers/
│   └── authController.js   # 注册 / 登录 / 个人信息
├── middleware/auth.js      # JWT 登录鉴权中间件
├── routes/
│   ├── auth.js             # /api/auth 路由
│   └── msg.js              # /api/msg 私信路由
├── db/schema.sql           # 数据库初始化脚本（users 表）
├── db/messages.sql         # 私信消息表迁移
├── .env                    # 本地配置（把 DB_PASSWORD 改成自己的密码）
└── .env.example            # 配置模板
```

## 启动步骤

> 本机（开发机）已完成环境部署：MySQL 8.0.46 已安装并注册为 Windows 服务（服务名 `MySQL80`，开机自启），
> 数据库 `campus_secondhand` 与 `users` 表已初始化。

1. 确认 MySQL 服务在运行（`services.msc` 里找到 `MySQL80`，或命令行 `Start-Service MySQL80`）。
2. 数据库连接账号配置在 `server/.env`（默认使用最小权限账号 `campus`，密码见 `.env`，**不要提交 .env 到 Git**）。
3. 启动后端：

   ```bash
   cd server
   npm install
   npm start
   ```

   看到 `✅ 后端服务已启动: http://localhost:3000` 即成功。

> 如果换到其他电脑部署：先安装 MySQL 8.0，再执行初始化脚本
> `mysql -u root -p < server/db/schema.sql` 和
> `mysql -u root -p campus_secondhand < server/db/messages.sql`，最后按 `.env.example` 配置连接信息。

## 对外接口

统一返回格式：`{ code, message, data }`，`code === 0` 表示成功。

| 方法 | 路径 | 说明 | 是否需要登录 |
| ---- | ---- | ---- | ---- |
| POST | /api/auth/register | 用户注册（注册成功自动登录） | 否 |
| POST | /api/auth/login | 用户登录 | 否 |
| GET | /api/auth/me | 获取当前用户信息 | 是 |
| PUT | /api/auth/me | 更新个人信息 | 是 |
| GET | /api/msg?peerId=2&afterId=0 | 获取与用户的聊天记录 | 是 |
| POST | /api/msg | 发送私信 | 是 |

### 私信接口

`POST /api/msg` 使用登录注册模块签发的 Bearer Token。发送者 ID 从已验证的令牌读取，客户端只传收件人和消息内容：

```json
{
  "receiverId": 2,
  "content": "你好，这件商品还在吗？"
}
```

消息不能为空，最长 2000 个字符。成功返回 HTTP 201 和 `data` 中的 `id`、`senderId`、`receiverId`、`content`、`createdAt`。

`GET /api/msg?peerId=2&afterId=0` 首次返回最近 50 条记录；将 `afterId` 设为当前最后一条消息 ID 可获取新消息（最多 100 条）。两个接口均要求登录，响应格式遵循 `{ code, message, data }`。

### 1. 注册 POST /api/auth/register

请求体：

```json
{
  "username": "zhangsan",
  "password": "123456",
  "nickname": "张三",
  "phone": "13800000000",
  "email": "zhangsan@example.com",
  "student_id": "2023010101"
}
```

返回（201）：

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "username": "zhangsan", "nickname": "张三", "avatar": null, "phone": "13800000000", "email": "zhangsan@example.com", "student_id": "2023010101" }
  }
}
```

### 2. 登录 POST /api/auth/login

请求体：`{ "username": "zhangsan", "password": "123456" }`

返回与注册一致，`data.token` 有效期默认 7 天。

### 3. 获取个人信息 GET /api/auth/me

请求头：`Authorization: Bearer <token>`

返回：`data.user` 为用户完整信息（不含密码）。

### 4. 更新个人信息 PUT /api/auth/me

请求头：`Authorization: Bearer <token>`
请求体（按需传，均可选）：`{ "nickname": "...", "avatar": "...", "phone": "...", "email": "...", "student_id": "..." }`

## 错误码约定

| code | 含义 |
| ---- | ---- |
| 1001 | 参数错误（含格式校验失败） |
| 1002 | 用户名已存在 |
| 1003 | 用户名或密码错误 / 用户不存在 |
| 1004 | 未登录或登录已过期 |
| 1005 | 服务器内部错误 |
| 1006 | 接口不存在 |
| 1007 | 登录尝试过多，账号临时锁定 |

## 校验与安全规则

- 用户名：3-30 位字母、数字或下划线。
- 密码：6-72 位，bcrypt 加盐哈希存储。
- 手机号：11 位（1 开头）；邮箱：标准邮箱格式；均为选填，提供时校验。
- 登录防爆破：同一用户名连续失败 5 次，锁定 5 分钟（内存实现，服务重启后重置）。

## 安全说明

- 密码使用 bcrypt 加盐哈希存储，数据库里不保存明文。
- 登录态使用 JWT（默认 7 天过期），其他成员模块如需登录态，直接复用 `middleware/auth.js` 与 `GET /api/auth/me`。
- 请勿把 `.env` 提交到 Git（已在 `.gitignore` 中忽略）。
