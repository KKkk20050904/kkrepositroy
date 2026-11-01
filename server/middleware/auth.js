/**
 * 登录校验中间件（JWT）
 *
 * 对接说明：本模块依赖"用户登录注册"模块（张三，feature/zhangsan-auth）。
 * - 张三的登录接口签发 JWT 时，使用与本项目 .env 中 JWT_SECRET 相同的密钥；
 * - 前端登录后把 token 存起来，请求时在请求头携带 Authorization: Bearer <token>；
 * - 通过校验后，req.user 为 { id, username, ... }，即当前登录用户。
 *
 * 联调说明：登录模块完成前，可以先临时注释掉路由里的 auth 中间件，
 * 并在请求体中传 userId 指定发布者，方便单独调试本模块。
 */
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'campus_secondhand_secret_key';

function auth(req, res, next) {
  // 兼容两种携带方式：Authorization: Bearer xxx 或 自定义请求头 token
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : (req.headers['token'] || '');

  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录状态无效，请重新登录' });
  }
}

module.exports = auth;
