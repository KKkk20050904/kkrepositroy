const jwt = require('jsonwebtoken');

// JWT 密钥：与 controllers/authController.js 保持一致（优先取 .env）
const JWT_SECRET = process.env.JWT_SECRET || 'campus-secondhand-dev-secret';

/**
 * 登录鉴权中间件：校验 Authorization: Bearer <token>
 * 通过后把 userId / user 挂到 req 上，供后续逻辑使用。
 * 登录态失效统一返回 code 1004（前端 request.js 会据此自动清除本地登录信息并跳转登录页）。
 */
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.userId;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
}

module.exports = { authRequired };
