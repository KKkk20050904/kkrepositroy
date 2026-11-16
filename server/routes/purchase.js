/**
 * 购买申请（线下交易意向确认）
 *
 * POST /api/purchase/requests       买家发起购买申请 { goodsId }
 * GET  /api/purchase/requests       查询申请：role=seller(默认，我收到的) / role=buyer(我发出的)
 *                                   可选参数：goodsId、status
 * PUT  /api/purchase/requests/:id   卖家处理：{ action: 'accept' | 'reject' }
 *
 * 状态：0 待处理、1 卖家已同意、2 卖家已拒绝
 * 说明：平台默认线下见面验货付款，卖家同意后由买卖双方自行完成交易。
 */
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');
const { absoluteUrl } = require('../utils/url');

router.use(authRequired);

// ==================== 买家发起购买申请 ====================
router.post('/requests', async (req, res, next) => {
  const goodsId = Number(req.body && req.body.goodsId);
  if (!Number.isSafeInteger(goodsId) || goodsId < 1) {
    return res.status(400).json({ code: 1001, message: 'goodsId 需为正整数' });
  }

  try {
    const [goodsRows] = await pool.query(
      'SELECT id, user_id, status FROM goods WHERE id = ?',
      [goodsId]
    );
    if (goodsRows.length === 0) {
      return res.status(404).json({ code: 1003, message: '商品不存在' });
    }
    const goods = goodsRows[0];
    if (Number(goods.status) !== 1) {
      return res.status(400).json({ code: 1001, message: '商品已下架或已售出' });
    }
    if (Number(goods.user_id) === Number(req.userId)) {
      return res.status(400).json({ code: 1001, message: '不能购买自己发布的商品' });
    }

    // 同一商品已有待处理申请时不允许重复发起
    const [exists] = await pool.query(
      'SELECT id FROM purchase_requests WHERE goods_id = ? AND buyer_id = ? AND status = 0 LIMIT 1',
      [goodsId, req.userId]
    );
    if (exists.length > 0) {
      return res.status(400).json({ code: 1002, message: '你已发起过购买申请，请等待卖家处理' });
    }

    const [result] = await pool.query(
      'INSERT INTO purchase_requests (goods_id, buyer_id, seller_id, status) VALUES (?, ?, ?, 0)',
      [goodsId, req.userId, goods.user_id]
    );

    res.status(201).json({
      code: 0,
      message: '已发起购买申请，等待卖家确认',
      data: { id: result.insertId, status: 0 }
    });
  } catch (err) {
    next(err);
  }
});

// ==================== 查询购买申请 ====================
router.get('/requests', async (req, res, next) => {
  const role = req.query.role === 'buyer' ? 'buyer' : 'seller';
  const rawGoodsId = req.query.goodsId;
  const goodsId = rawGoodsId === undefined || rawGoodsId === '' ? null : Number(rawGoodsId);
  const rawStatus = req.query.status;
  const status = rawStatus === undefined || rawStatus === '' ? null : Number(rawStatus);

  if (goodsId !== null && (!Number.isSafeInteger(goodsId) || goodsId < 1)) {
    return res.status(400).json({ code: 1001, message: 'goodsId 需为正整数' });
  }
  if (status !== null && ![0, 1, 2].includes(status)) {
    return res.status(400).json({ code: 1001, message: 'status 只能是 0、1、2' });
  }

  const where = [role === 'buyer' ? 'r.buyer_id = ?' : 'r.seller_id = ?'];
  const params = [req.userId];
  if (goodsId !== null) {
    where.push('r.goods_id = ?');
    params.push(goodsId);
  }
  if (status !== null) {
    where.push('r.status = ?');
    params.push(status);
  }
  const peerCol = role === 'buyer' ? 'r.seller_id' : 'r.buyer_id';

  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.goods_id, r.buyer_id, r.seller_id, r.status, r.created_at, r.updated_at,
              g.title, g.price, g.original_price, g.status AS goods_status,
              (SELECT image_url FROM goods_images WHERE goods_id = g.id ORDER BY sort_order ASC, id ASC LIMIT 1) AS image,
              u.nickname AS peer_name, u.username AS peer_username
       FROM purchase_requests r
       JOIN goods g ON g.id = r.goods_id
       JOIN users u ON u.id = ${peerCol}
       WHERE ${where.join(' AND ')}
       ORDER BY r.created_at DESC, r.id DESC`,
      params
    );
    rows.forEach((row) => {
      row.image = absoluteUrl(req, row.image);
    });
    res.json({ code: 0, message: '获取成功', data: { list: rows } });
  } catch (err) {
    next(err);
  }
});

// ==================== 卖家处理购买申请 ====================
router.put('/requests/:id', async (req, res, next) => {
  const id = Number(req.params.id);
  const action = String((req.body && req.body.action) || '');
  if (!Number.isSafeInteger(id) || id < 1) {
    return res.status(400).json({ code: 1001, message: '申请ID无效' });
  }
  if (action !== 'accept' && action !== 'reject') {
    return res.status(400).json({ code: 1001, message: 'action 只能是 accept 或 reject' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM purchase_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 1003, message: '购买申请不存在' });
    }
    if (Number(rows[0].seller_id) !== Number(req.userId)) {
      return res.status(403).json({ code: 1003, message: '只能处理自己商品的购买申请' });
    }
    if (Number(rows[0].status) !== 0) {
      return res.status(400).json({ code: 1001, message: '该申请已处理过' });
    }

    const status = action === 'accept' ? 1 : 2;
    await pool.query('UPDATE purchase_requests SET status = ? WHERE id = ?', [status, id]);

    res.json({
      code: 0,
      message: action === 'accept' ? '已同意购买申请' : '已拒绝购买申请',
      data: { id, status }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
