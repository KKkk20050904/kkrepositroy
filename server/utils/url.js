/**
 * 把数据库里保存的相对地址（如 /uploads/seed/demo-01.png）
 * 转换为当前请求可访问的完整 URL（如 http://localhost:3000/uploads/seed/demo-01.png）
 *
 * 原因：前端 H5 运行在 HBuilderX 的 8080 端口，若返回相对路径，
 * 浏览器会把图片解析成 http://localhost:8080/uploads/... 导致 404。
 */
function absoluteUrl(req, p) {
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p;
  const host = req.get('host');
  if (!host) return p;
  return `${req.protocol}://${host}${p.startsWith('/') ? '' : '/'}${p}`;
}

module.exports = { absoluteUrl };
