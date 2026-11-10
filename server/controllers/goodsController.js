/**
 * 商品发布与图片上传控制器（模块2：闲置商品发布、图片上传 —— 合并版）
 * 已对接登录模块：发布者 ID 从登录态 req.userId 获取。
 */
const pool = require('../config/db');

/**
 * 发布闲置商品
 * POST /api/goods
 * body(JSON): {
 *   title:        string  商品标题（必填，≤50字）
 *   description:  string  商品描述（选填，≤500字）
 *   price:        number  转让价格（必填，>0）
 *   originalPrice:number  原价（选填）
 *   categoryId:   number  分类ID（选填，为 0/undefined 时存为 NULL）
 *   images:       string[] 图片URL数组（最多9张，来自 /api/upload 返回值）
 * }
 */
async function createGoods(req, res, next) {
  const { title, description = '', price, originalPrice, categoryId, images = [] } = req.body || {};

  // ---------- 参数校验 ----------
  if (!title || !title.trim()) {
    return res.status(400).json({ code: 1001, message: '商品标题不能为空' });
  }
  if (title.trim().length > 50) {
    return res.status(400).json({ code: 1001, message: '商品标题不能超过50个字' });
  }
  if (price === undefined || price === null || price === '' || Number(price) <= 0 || !Number.isFinite(Number(price))) {
    return res.status(400).json({ code: 1001, message: '请填写正确的商品价格' });
  }
  if (!Array.isArray(images) || images.length > 9) {
    return res.status(400).json({ code: 1001, message: '商品图片最多上传9张' });
  }

  // 过滤空字符串，避免写入无效图片记录
  const imageList = images.filter((u) => typeof u === 'string' && u.trim().length > 0);
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ code: 1004, message: '缺少发布者信息，请先登录' });
  }

  // 注意：获取连接与事务操作必须包在 try/catch 中，
  // 否则数据库不可用时未处理的 Promise 拒绝会直接崩掉 Node 进程
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. 写入商品主表
    const [result] = await conn.execute(
      `INSERT INTO goods
         (user_id, title, description, price, original_price, category_id, status)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        title.trim(),
        description.trim(),
        Number(price),
        originalPrice ? Number(originalPrice) : null,
        categoryId ? Number(categoryId) : null
      ]
    );
    const goodsId = result.insertId;

    // 2. 写入商品图片表（一商品多图）
    for (let i = 0; i < imageList.length; i++) {
      await conn.execute(
        `INSERT INTO goods_images (goods_id, image_url, sort_order) VALUES (?, ?, ?)`,
        [goodsId, imageList[i], i]
      );
    }

    await conn.commit();
    res.json({ code: 0, message: '发布成功', data: { id: goodsId } });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (rollbackErr) { /* 回滚失败不覆盖原错误 */ }
    }
    next(err);
  } finally {
    if (conn) conn.release();
  }
}

/**
 * 上传图片
 * POST /api/upload
 * multipart/form-data，字段名 files，最多9张，单张≤5MB
 * 成功返回图片相对地址数组（配合 /uploads 静态目录访问）
 */
function uploadImages(req, res) {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ code: 1001, message: '请选择要上传的图片' });
  }
  const urls = files.map((f) => `/uploads/${f.filename}`);
  res.json({ code: 0, message: '上传成功', data: { urls } });
}

module.exports = { createGoods, uploadImages };
