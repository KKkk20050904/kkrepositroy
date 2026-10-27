# 第一部分：用户登录注册模块（前端）

> 对应分工表第 1 项（张三 · feature/zhangsan-auth），仅包含登录 / 注册两个页面。
> 首页、个人中心等页面由其他成员负责，登录注册页的跳转目标（如首页）待相应成员
> 的页面合并后再接入。

## 目录结构

```
frontend/
├── main.js                 # 入口（Vue3）
├── App.vue                 # 应用根组件
├── pages.json              # 页面路由配置
├── manifest.json           # 应用配置（HBuilderX）
├── common/request.js       # 请求封装 + token 存取
├── api/auth.js             # 登录注册接口封装
└── pages/
    ├── login/login.vue     # 登录页
    └── register/register.vue  # 注册页
```

## 运行方式

1. 用 HBuilderX 打开本 `frontend` 目录。
2. 启动后端服务（见 `server/README.md`）。
3. 浏览器运行：菜单「运行 → 运行到浏览器」，或「运行 → 小程序模拟器 → 微信开发者工具」。
4. 真机调试时，把 `common/request.js` 里的 `BASE_URL` 改成电脑的局域网 IP，例如 `http://192.168.x.x:3000`。

## 已实现的交互

- 登录页：用户名 + 密码，登录成功后将 token 和用户信息存入本地缓存，供其他模块读取。
- 注册页：用户名（必填）、密码（至少 6 位）、确认密码、昵称、手机号；注册成功自动登录。
- 请求封装：已登录时自动携带 `Authorization: Bearer <token>`，供 `GET/PUT /api/auth/me` 等需要登录态的接口直接复用。

## 与其他成员协作约定

- 登录态统一存放在本地缓存 `token`、`user` 中（见 `common/request.js`）。
- 接口返回格式统一为 `{ code, message, data }`，`code === 0` 为成功；错误提示由 `request` 统一弹出，页面无需重复处理。
