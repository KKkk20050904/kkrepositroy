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

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
  if (!Number.isSafeInteger(payload.userId) || payload.userId < 1) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
  req.userId = payload.userId;
  return next();
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader) {
    return next();
  }
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }

  let payload;
  try {
    payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
  } catch (err) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
  if (!Number.isSafeInteger(payload.userId) || payload.userId < 1) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
  req.userId = payload.userId;
  return next();
}

module.exports = { authRequired, optionalAuth };
