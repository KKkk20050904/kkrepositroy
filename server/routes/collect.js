/**
 * 收藏模块路由（合并版：统一响应格式 code 0 / 1001-1007）
 * 挂载前缀：/api/collect，均需登录。
 *
 *   POST   /api/collect            收藏商品 { goodsId }
 *   DELETE /api/collect/:goodsId   取消收藏
 *   GET    /api/collect            我的收藏列表 ?page=&pageSize=
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

router.use(authRequired);

function parsePositiveInt(value) {
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

// ==================== 收藏商品 ====================
router.post('/', async (req, res, next) => {
  const goodsId = parsePositiveInt(req.body && req.body.goodsId);
  if (!goodsId) {
    return res.status(400).json({ code: 1001, message: 'goodsId 需为正整数' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO collect(user_id, goods_id) SELECT ?, id FROM goods WHERE id = ? AND status = 1',
      [req.userId, goodsId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ code: 1003, message: '商品不存在或已下架' });
    }
    res.json({ code: 0, message: '收藏成功', data: null });
  } catch (err) {
    if (err && err.errno === 1062) {
      return res.status(400).json({ code: 1002, message: '已经收藏过该商品' });
    }
    next(err);
  }
});

// ==================== 取消收藏 ====================
router.delete('/:goodsId', async (req, res, next) => {
  const goodsId = parsePositiveInt(req.params.goodsId);
  if (!goodsId) {
    return res.status(400).json({ code: 1001, message: '商品ID无效' });
  }

  try {
    await pool.query('DELETE FROM collect WHERE user_id = ? AND goods_id = ?', [req.userId, goodsId]);
    res.json({ code: 0, message: '已取消收藏', data: null });
  } catch (err) {
    next(err);
  }
});

// ==================== 我的收藏列表（分页） ====================
router.get('/', async (req, res, next) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const pageSize = req.query.pageSize === undefined ? 10 : Number(req.query.pageSize);
  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100) {
    return res.status(400).json({ code: 1001, message: 'page 需为正整数，pageSize 需为 1-100 的整数' });
  }
  const offset = (page - 1) * pageSize;

  try {
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total
       FROM collect c
       JOIN goods g ON c.goods_id = g.id
       WHERE c.user_id = ? AND g.status = 1`,
      [req.userId]
    );
    const total = Number(countRows[0].total);

    const [rows] = await pool.query(
      `SELECT c.id AS collect_id, c.create_time,
              g.id, g.title, g.price, g.original_price, g.category_id, g.status,
              (SELECT image_url FROM goods_images WHERE goods_id = g.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS image
       FROM collect c
       JOIN goods g ON c.goods_id = g.id
       WHERE c.user_id = ? AND g.status = 1
       ORDER BY c.create_time DESC, c.id DESC
       LIMIT ? OFFSET ?`,
      [req.userId, pageSize, offset]
    );

    res.json({
      code: 0,
      message: '获取收藏列表成功',
      data: {
        list: rows,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
