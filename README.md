# 校园闲置物品交易小程序

> 课程设计小组项目 · 面向在校大学生的二手闲置交易平台
> 前端 uni-app（Vue3） ｜ 后端 Node.js + Express ｜ 数据库 MySQL 8.0 ｜ 无 AI 功能

## 📖 项目简介

本项目帮助在校学生发布、浏览、搜索二手物品，支持商品收藏与用户私信沟通，方便校内物品流转、减少资源浪费。

## ✨ 功能一览

| 模块 | 功能 | 负责人 |
| ---- | ---- | ---- |
| 用户模块 | 注册（自动登录）、登录（防爆破锁定）、个人信息、修改密码 | 张三 |
| 发布模块 | 商品发布（标题/描述/价格/原价/分类/多图）、图片上传 | 李四 |
| 商品模块 | 商品列表、关键词搜索、分类筛选、分页加载 | 王五 |
| 详情收藏 | 商品详情、收藏/取消收藏、我的收藏列表 | 赵六 |
| 私信模块 | 会话列表、联系人、聊天记录、发送私信（自动轮询新消息） | 钱七 |
| 首页分类 | 首页、分类、个人中心页面（静态原型 + 分类接口） | 孙八 |

## 🛠️ 技术选型

- 前端：uni-app（Vue3，HBuilderX）
- 后端：Node.js + Express
- 数据库：MySQL 8.0
- 鉴权：JWT（jsonwebtoken）+ 密码加密（bcryptjs）
- AI：无

## 📂 目录结构

```
campus-secondhand-trade/
├── README.md
├── docs/
│   ├── 模块1-登录注册.md        # 张三模块文档
│   └── 模块2-发布与上传.md      # 李四模块文档
├── frontend/                    # uni-app 前端工程（用 HBuilderX 打开 frontend/ 目录）
│   ├── pages/
│   │   ├── index/index.vue      # 首页
│   │   ├── goods/list.vue       # 商品列表（搜索/分类/分页）
│   │   ├── goods-detail/        # 商品详情 + 收藏
│   │   ├── publish/publish.vue  # 发布闲置
│   │   ├── login/login.vue      # 登录
│   │   ├── register/register.vue# 注册
│   │   ├── my-collect/          # 我的收藏
│   │   └── chat/list.vue、chat.vue  # 私信列表与聊天窗
│   ├── api/                     # 接口封装（request.js / goods.js / auth.js / message.js）
│   ├── common/request.js        # 统一请求封装（自动带 token、登录失效自动跳转）
│   └── pages.json               # 页面注册
├── scripts/
│   ├── test-auth.cjs            # 登录模块接口测试（28 项断言）
│   └── smoke-test.cjs           # 全链路冒烟测试（注册→发布→列表→详情→收藏→私信）
├── prototype/                   # 孙八的首页/分类/个人中心静态原型（零依赖，node prototype/server.js 即可预览）
└── server/                      # Node.js 后端
    ├── app.js                   # 服务入口
    ├── config/db.js             # MySQL 连接池
    ├── controllers/             # authController（张三）、goodsController（李四）
    ├── middleware/              # auth.js（JWT 鉴权）、upload.js（图片上传）
    ├── routes/                  # auth / goods / msg / collect
    ├── sql/init.sql             # 建库建表 + 分类种子数据（全部模块）
    └── uploads/                 # 上传图片目录
```

## 🚀 快速启动

### 1. 后端

```bash
cd server
npm install
# 1) 初始化数据库（MySQL 已启动）
mysql -u root -p < sql/init.sql
# 2) 复制配置模板并填写数据库账号密码
#    Windows: copy .env.example .env ；Linux/macOS: cp .env.example .env
# 3) 启动
node app.js
```

启动成功访问 http://localhost:3000/api/health 返回 `{"code":0,...}` 即正常。

### 2. 前端（HBuilderX）

1. 打开 HBuilderX → 文件 → 导入 → 从本地目录导入 → 选择 `frontend/` 目录；
2. 运行 → 运行到浏览器（H5）或运行到小程序模拟器（需微信开发者工具）；
3. 真机调试时把 `frontend/common/request.js` 与 `frontend/api/request.js` 中的 `http://localhost:3000` 改成电脑局域网 IP。

### 3. 孙八的静态原型（可选）

```bash
cd prototype
node server.js     # 打开 http://localhost:3000
```

## 🔌 统一接口规范

- 响应格式：`{ code, message, data }`，成功 `code = 0`；失败 `code` 见下表；
- 需要登录的接口请求头携带 `Authorization: Bearer <token>`；
- 登录失效统一返回 `401 + code 1004`，前端 `common/request.js` 会自动清理登录态并跳登录页。

| code | 含义 |
| ---- | ---- |
| 0 | 成功 |
| 1001 | 请求参数格式错误 |
| 1002 | 已存在（用户名已注册 / 已收藏过该商品） |
| 1003 | 用户名或密码错误 / 资源不存在 |
| 1004 | 未登录或登录已过期 |
| 1005 | 服务器内部错误 |
| 1006 | 接口不存在 |
| 1007 | 登录尝试次数过多（锁定） |

## 📡 接口总览

| 接口 | 方法 | 说明 | 需登录 |
| ---- | ---- | ---- | ---- |
| /api/auth/register | POST | 注册（成功即登录） | 否 |
| /api/auth/login | POST | 登录 | 否 |
| /api/auth/me | GET | 当前用户信息 | 是 |
| /api/auth/me | PUT | 修改个人信息 | 是 |
| /api/auth/password | PUT | 修改密码 | 是 |
| /api/category | GET | 分类列表 | 否 |
| /api/goods | GET | 商品列表（keyword/categoryId/page/pageSize） | 否 |
| /api/goods/:id | GET | 商品详情（含 isCollect、images） | 否 |
| /api/goods | POST | 发布商品 | 是 |
| /api/upload | POST | 图片上传（multipart，字段 files） | 是 |
| /api/collect | POST | 收藏商品 { goodsId } | 是 |
| /api/collect/:goodsId | DELETE | 取消收藏 | 是 |
| /api/collect | GET | 我的收藏（分页） | 是 |
| /api/msg | GET | 聊天记录（peerId/afterId） | 是 |
| /api/msg | POST | 发送私信 { receiverId, content } | 是 |
| /api/msg/conversations | GET | 会话列表 | 是 |
| /api/msg/contacts | GET | 联系人（可搜索） | 是 |

## 🗄️ 数据库

`server/sql/init.sql` 一次性创建 `campus_secondhand` 库及全部表：
`users`（用户）、`category`（分类）、`goods`（商品）、`goods_images`（商品图片）、`messages`（私信）、`collect`（收藏），并写入 7 个分类种子数据。

> 如果你之前在本地跑过旧版 init.sql，库里会有旧的 `user` 表（单数），可执行 `DROP TABLE user;` 清理。

## 🧪 接口自测

```bash
node scripts/test-auth.cjs    # 登录模块 28 项断言
node scripts/smoke-test.cjs   # 全链路冒烟测试（注册→图片上传→发布→列表/搜索→详情→收藏→私信）
```

两个脚本都要求后端已启动、数据库已初始化。

## 👥 成员分工

| 成员 | 负责模块 | 分支 |
| ---- | ---- | ---- |
| 张三 | 用户登录注册、个人信息管理 | feature/zhangsan-auth |
| 李四 | 闲置商品发布、图片上传 | feature/lisi-publish |
| 王五 | 商品列表、搜索、分页 | feature/wangwu-goods-list |
| 赵六 | 商品详情、收藏功能 | feature/zhaoliu-collect |
| 钱七 | 私信聊天模块 | feature/qianqi-message |
| 孙八 | 首页、分类、个人中心页面 | feature/sunba-homepage |
