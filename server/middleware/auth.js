/**
 * 登录鉴权中间件（全项目共用 —— 合并版）
 *
 * 对接约定（与登录注册模块保持一致）：
 * - 登录接口签发 JWT，payload 为 { userId, username }，密钥取 .env 的 JWT_SECRET；
 * - 前端请求头携带 Authorization: Bearer <token>；
 * - 校验通过后：req.userId 为当前用户 ID，req.user 为完整 payload；
 * - 登录态失效统一返回 HTTP 401 + code 1004（前端 request.js 据此自动清理登录态并跳登录页）。
 *
 * 两个导出：
 * - authRequired：必须登录（发布商品、上传图片、收藏、私信等）
 * - optionalAuth：可选登录（商品详情等公开接口，带了 token 就识别用户，带了无效 token 按未登录处理）
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_secondhand_secret_key';

function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function isValidPayload(payload) {
  return payload && Number.isSafeInteger(payload.userId) && payload.userId > 0;
}

function authRequired(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!isValidPayload(payload)) throw new Error('无效的登录凭证');
    req.userId = payload.userId;
    req.user = payload;
    return next();
  } catch (err) {
    return res.status(401).json({ code: 1004, message: '未登录或登录已过期' });
  }
}

function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (isValidPayload(payload)) {
      req.userId = payload.userId;
      req.user = payload;
    }
  } catch (err) {
    // 无效 token 按未登录处理，不阻塞公开接口
  }
  return next();
}

module.exports = { authRequired, optionalAuth };
