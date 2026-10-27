# UniApp 前端：登录、注册与私信

> 登录注册与私信聊天前端页面，基于 UniApp + Vue 3。
> 消息中心采用小组主页的移动端红色主题与卡片样式；将主页消息图标接入时，跳转到 `/pages/chat/list`。

## 目录结构

```
frontend/
├── main.js                 # 入口（Vue3）
├── App.vue                 # 应用根组件
├── pages.json              # 页面路由配置
├── manifest.json           # 应用配置（HBuilderX）
├── common/request.js       # 请求封装 + token 存取
├── api/
│   ├── auth.js             # 登录注册接口封装
│   └── message.js          # 私信历史与发送接口
└── pages/
    ├── login/login.vue     # 登录页
    ├── register/register.vue  # 注册页
    ├── chat/list.vue       # 会话 / 联系人列表
    └── chat/chat.vue       # 私信聊天页
```

## 运行方式

1. 用 HBuilderX 打开本 `frontend` 目录。
2. 启动后端服务（见 `server/README.md`）。
3. 浏览器运行：菜单「运行 → 运行到浏览器」，或「运行 → 小程序模拟器 → 微信开发者工具」。
4. 真机调试时，把 `common/request.js` 里的 `BASE_URL` 改成电脑的局域网 IP，例如 `http://192.168.x.x:3000`。

## 已实现的交互

- 登录页：用户名 + 密码，登录成功后将 token 和用户信息存入本地缓存，供其他模块读取。
- 注册页：用户名（必填）、密码（至少 6 位）、确认密码、昵称、手机号；注册成功自动登录。
- 私信页：支持文字、表情、颜文字、特殊符号和文字贴纸，登录用户可与指定用户收发消息并自动轮询新消息。
- 消息中心：按主页的红色主题展示会话、未读数和联系人，可搜索联系人并进入私信。
- 请求封装：已登录时自动携带 `Authorization: Bearer <token>`，供 `GET/PUT /api/auth/me` 等需要登录态的接口直接复用。

## 打开私信页

主页消息入口可打开会话列表：

```js
uni.navigateTo({ url: '/pages/chat/list' })
```

商品详情页等知道卖家用户 ID 的页面可以这样打开聊天页：

```js
uni.navigateTo({
  url: `/pages/chat/chat?peerId=${seller.id}&name=${encodeURIComponent(seller.nickname || seller.username)}&avatar=${encodeURIComponent(seller.avatar || '')}`
})
```

私信功能需先运行 `server/db/messages.sql` 创建消息表；后端通过 `POST /api/msg` 保存消息、`GET /api/msg/conversations` 加载会话和未读数、`GET /api/msg` 加载聊天记录及轮询新消息。

## 与其他成员协作约定

- 登录态统一存放在本地缓存 `token`、`user` 中（见 `common/request.js`）。
- 接口返回格式统一为 `{ code, message, data }`，`code === 0` 为成功；错误提示由 `request` 统一弹出，页面无需重复处理。
