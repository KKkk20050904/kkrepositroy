/**
 * 商品相关路由（合并版）
 * 挂载前缀：/api
 *
 * 接口清单：
 *   GET    /api/category        分类列表（孙八模块接口，供列表/发布页使用）
 *   GET    /api/goods           商品列表：关键词搜索 + 分类筛选 + 分页（王五模块）
 *   GET    /api/goods/:id       商品详情（含是否已收藏，赵六/王五模块）
 *   POST   /api/goods           发布闲置商品（李四模块，需登录）
 *   POST   /api/upload          图片上传（李四模块，需登录）
 *
 * 响应统一为 { code, message, data }：成功 code=0；参数错误 1001；不存在 1003；未登录 1004；服务器错误 1005。
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const goodsController = require('../controllers/goodsController');
const { authRequired, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

/** 解析分页参数：page≥1，1≤pageSize≤100 */
function parsePaging(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const pageSize = query.pageSize === undefined ? 10 : Number(query.pageSize);
  if (!Number.isSafeInteger(page) || page < 1) return null;
  if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) return null;
  return { page, pageSize };
}

// ==================== 分类列表（公开） ====================
router.get('/category', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, icon, sort_order FROM category ORDER BY sort_order ASC, id ASC'
    );
    res.json({ code: 0, message: 'ok', data: rows });
  } catch (err) {
    next(err);
  }
});

// ==================== 商品列表（公开）：关键词搜索 + 分类筛选 + 分页 ====================
router.get('/goods', async (req, res, next) => {
  const paging = parsePaging(req.query);
  if (!paging) {
    return res.status(400).json({ code: 1001, message: 'page 需为正整数，pageSize 需为 1-100 的整数' });
  }
  const { page, pageSize } = paging;
  const keyword = (req.query.keyword || '').toString().trim().slice(0, 50);
  // 兼容前端传入 categoryId 或 category_id
  const rawCategory = req.query.categoryId !== undefined ? req.query.categoryId : req.query.category_id;
  const categoryId = rawCategory === undefined || rawCategory === '' || rawCategory === '0' ? null : Number(rawCategory);
  if (categoryId !== null && (!Number.isSafeInteger(categoryId) || categoryId < 1)) {
    return res.status(400).json({ code: 1001, message: 'categoryId 需为正整数' });
  }

  const where = ['g.status = 1'];
  const params = [];
  const countParams = [];
  if (keyword) {
    where.push('g.title LIKE ?');
    params.push(`%${keyword}%`);
    countParams.push(`%${keyword}%`);
  }
  if (categoryId !== null) {
    where.push('g.category_id = ?');
    params.push(categoryId);
    countParams.push(categoryId);
  }
  const whereSql = 'WHERE ' + where.join(' AND ');

  try {
    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM goods g ${whereSql}`, countParams);
    const total = Number(countRows[0].total);

    const [rows] = await pool.query(
      `SELECT g.id, g.title, g.price, g.original_price, g.category_id, g.status,
              g.created_at AS create_time,
              (SELECT image_url FROM goods_images WHERE goods_id = g.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS cover,
              u.nickname AS seller_name
       FROM goods g
       LEFT JOIN users u ON u.id = g.user_id
       ${whereSql}
       ORDER BY g.created_at DESC, g.id DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, (page - 1) * pageSize]
    );

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        list: rows,
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total
      }
    });
  } catch (err) {
    next(err);
  }
});

// ==================== 商品详情（公开；可选登录，返回是否已收藏） ====================
router.get('/goods/:id', optionalAuth, async (req, res, next) => {
  const goodsId = Number(req.params.id);
  if (!Number.isSafeInteger(goodsId) || goodsId < 1) {
    return res.status(400).json({ code: 1001, message: '商品ID无效' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT g.*,
              g.created_at AS create_time,
              (SELECT image_url FROM goods_images WHERE goods_id = g.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS image,
              u.nickname, u.avatar
       FROM goods g
       LEFT JOIN users u ON u.id = g.user_id
       WHERE g.id = ? AND g.status = 1`,
      [goodsId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ code: 1003, message: '商品不存在或已下架' });
    }

    const goods = rows[0];
    const [imageRows] = await pool.query(
      'SELECT image_url FROM goods_images WHERE goods_id = ? ORDER BY sort_order ASC, id ASC',
      [goodsId]
    );
    goods.images = imageRows.map((r) => r.image_url);

    goods.isCollect = false;
    if (req.userId) {
      const [collectRows] = await pool.query(
        'SELECT id FROM collect WHERE user_id = ? AND goods_id = ?',
        [req.userId, goodsId]
      );
      goods.isCollect = collectRows.length > 0;
    }

    res.json({ code: 0, message: '获取成功', data: goods });
  } catch (err) {
    next(err);
  }
});

// ==================== 发布闲置商品（需登录） ====================
router.post('/goods', authRequired, goodsController.createGoods);

// ==================== 图片上传（需登录） ====================
router.post('/upload', authRequired, upload.array('files', 9), goodsController.uploadImages);

module.exports = router;
