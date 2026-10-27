# 校园闲置交易小程序后端

> 对应分工表第 1 项（张三 · feature/zhangsan-auth），面向其他成员提供统一接口。
> 技术栈：Node.js + Express + MySQL，无 AI。

## 目录结构

```
server/
├── app.js                  # 服务入口
├── db.js                   # 商品和收藏路由的数据库查询适配器
├── config/db.js            # MySQL 连接池
├── controllers/
│   └── authController.js   # 注册 / 登录 / 个人信息
├── middleware/auth.js      # JWT 登录鉴权中间件
├── routes/                 # 登录、商品详情、收藏路由
├── db/schema.sql           # users、category、goods、collect 表
├── .env                    # 本地配置（把 DB_PASSWORD 改成自己的密码）
└── .env.example            # 配置模板
```

## 启动步骤

首次运行需要先配置 MySQL 和环境变量，再初始化数据库。

1. 确认 MySQL 服务正在运行。
2. 复制 `server/.env.example` 为 `server/.env`，填写数据库账号、密码和 JWT 密钥。不要提交 `.env`。
3. 从项目根目录初始化数据库：

   ```bash
   mysql -u root -p < server/db/schema.sql
   ```

4. 安装依赖并启动：

   ```bash
   cd server
   npm ci
   npm start
   ```

   看到 `✅ 后端服务已启动: http://localhost:3000` 即成功。

> 数据库初始化脚本使用 `CREATE TABLE IF NOT EXISTS`，不会删除已有数据。

## 对外接口

登录接口成功时返回 `code === 0`；商品和收藏接口成功时返回 `code === 200`。
需要登录的接口使用 `Authorization: Bearer <token>` 请求头，token 取自登录或注册响应的 `data.token`。

| 方法 | 路径 | 说明 | 是否需要登录 |
| ---- | ---- | ---- | ---- |
| GET | /api/goods/:id | 商品详情 | 否（登录后返回收藏状态） |
| POST | /api/collect | 收藏商品 | 是 |
| DELETE | /api/collect/:goodsId | 取消收藏 | 是 |
| GET | /api/collect | 获取我的收藏（分页） | 是 |

| 方法 | 路径 | 说明 | 是否需要登录 |
| ---- | ---- | ---- | ---- |
| POST | /api/auth/register | 用户注册（注册成功自动登录） | 否 |
| POST | /api/auth/login | 用户登录 | 否 |
| GET | /api/auth/me | 获取当前用户信息 | 是（Bearer Token） |
| PUT | /api/auth/me | 更新个人信息 | 是（Bearer Token） |

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
