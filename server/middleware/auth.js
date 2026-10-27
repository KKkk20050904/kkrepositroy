const jwt = require('jsonwebtoken');

/**
 * 登录鉴权中间件：校验 Authorization: Bearer <token>
 * 通过后把 userId 挂到 req 上
 */
function authRequired(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
}

module.exports = { authRequired };
