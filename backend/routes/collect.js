const express = require('express')
const router = express.Router()
const db = require('../db')

/**
 * @api POST /api/collect
 * @desc 收藏商品
 */
router.post('/', (req, res) => {
  const rawGoodsId = req.body?.goodsId
  const goodsId = Number(rawGoodsId)
  const userId = req.user?.id
  if (!userId) {
    return res.json({ code: 401, msg: "请先登录", data: null })
  }
  if ((typeof rawGoodsId !== 'number' && typeof rawGoodsId !== 'string') ||
      (typeof rawGoodsId === 'string' && !/^\d+$/.test(rawGoodsId)) ||
      !Number.isSafeInteger(goodsId) || goodsId < 1) {
    return res.json({ code: 400, msg: "goodsId需为正整数", data: null })
  }
  const sql = `
    INSERT INTO collect(user_id, goods_id)
    SELECT ?, id FROM goods WHERE id = ? AND status = 1
  `
  db.query(sql, [userId, goodsId], (err, result) => {
    if (err) {
      // 唯一索引冲突：重复收藏
      if (err.errno === 1062) {
        return res.json({ code: 400, msg: "已经收藏过该商品", data: null })
      }
      console.error(err)
      return res.json({ code: 500, msg: "收藏失败", data: null })
    }
    if (result.affectedRows === 0) {
      return res.json({ code: 404, msg: "商品不存在或已下架", data: null })
    }
    res.json({ code: 200, msg: "收藏成功" })
  })
})

/**
 * @api DELETE /api/collect/:goodsId
 * @desc 取消收藏商品
 */
router.delete('/:goodsId', (req, res) => {
  const goodsId = req.params.goodsId
  const userId = req.user?.id
  if (!userId) {
    return res.json({ code: 401, msg: "请先登录", data: null })
  }
  if (!/^\d+$/.test(goodsId) ||
      !Number.isSafeInteger(Number(goodsId)) || Number(goodsId) < 1) {
    return res.json({ code: 400, msg: "商品ID无效", data: null })
  }
  const sql = `DELETE FROM collect WHERE user_id=? AND goods_id=?`
  db.query(sql, [userId, goodsId], (err) => {
    if (err) {
      console.error("取消收藏失败:", err)
      return res.json({ code: 500, msg: "取消收藏失败", data: null })
    }
    res.json({ code: 200, msg: "已取消收藏" })
  })
})

/**
 * @api GET /api/collect
 * @desc 获取我的收藏列表 分页
 * query: page pageSize
 */
router.get('/', (req, res) => {
  const userId = req.user?.id
  if (!userId) {
    return res.json({ code: 401, msg: "请先登录", data: null })
  }
  const page = req.query.page === undefined ? 1 : Number(req.query.page)
  const pageSize = req.query.pageSize === undefined ? 10 : Number(req.query.pageSize)
  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)) {
    return res.json({ code: 400, msg: "page需为正整数，pageSize需为1到100之间的整数", data: null })
  }
  const offset = (page - 1) * pageSize

  const listSql = `
    SELECT c.id collect_id, g.*
    FROM collect c
    LEFT JOIN goods g ON c.goods_id = g.id
    WHERE c.user_id = ? AND g.status = 1
    ORDER BY c.create_time DESC
    LIMIT ? OFFSET ?
  `
  const countSql = `
    SELECT COUNT(*) total FROM collect c
    LEFT JOIN goods g ON c.goods_id = g.id
    WHERE c.user_id = ? AND g.status = 1
  `
  db.query(countSql, [userId], (err, countRes) => {
    if (err) {
      console.error("查询收藏总数失败:", err)
      return res.json({ code: 500, msg: "服务器错误", data: null })
    }
    const total = countRes[0].total
    db.query(listSql, [userId, pageSize, offset], (err, listRes) => {
      if (err) {
        console.error("查询收藏列表失败:", err)
        return res.json({ code: 500, msg: "服务器错误", data: null })
      }
      res.json({
        code: 200,
        msg: "获取收藏列表成功",
        data: {
          list: listRes,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      })
    })
  })
})

module.exports = router