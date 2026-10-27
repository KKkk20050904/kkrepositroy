const express = require('express');
const router = express.Router();
const db = require('../db');
const { optionalAuth } = require('../middleware/auth');
/**
 * 商品列表接口【3号原有代码，禁止修改】
 * GET /api/goods
 * 参数：
 *   page       页码，默认 1
 *   pageSize   每页条数，默认 10
 *   keyword    搜索关键词，模糊匹配标题
 *   categoryId 分类ID，筛选对应分类
 */
router.get('/', (req, res) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const pageSize = req.query.pageSize === undefined ? 10 : Number(req.query.pageSize);
  const keyword = req.query.keyword || '';
  const categoryId = req.query.categoryId || '';
  if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 100 ||
      !Number.isSafeInteger((page - 1) * pageSize)) {
    return res.json({ code: 400, msg: 'page需为正整数，pageSize需为1到100之间的整数', data: null });
  }
  if (categoryId && (!/^\d+$/.test(String(categoryId)) ||
      !Number.isSafeInteger(Number(categoryId)) || Number(categoryId) < 1)) {
    return res.json({ code: 400, msg: 'categoryId需为正整数', data: null });
  }
  const offset = (page - 1) * pageSize;
  let querySql = `SELECT id, title, price, image, category_id, create_time
                  FROM goods WHERE status = 1`;
  let countSql = `SELECT COUNT(*) AS total FROM goods WHERE status = 1`;
  let queryParams = [];
  let countParams = [];
  // 关键词搜索
  if (keyword) {
    querySql += ' AND title LIKE ?';
    countSql += ' AND title LIKE ?';
    const searchVal = `%${keyword}%`;
    queryParams.push(searchVal);
    countParams.push(searchVal);
  }
  // 分类筛选
  if (categoryId) {
    querySql += ' AND category_id = ?';
    countSql += ' AND category_id = ?';
    queryParams.push(categoryId);
    countParams.push(categoryId);
  }
  querySql += ' ORDER BY create_time DESC LIMIT ? OFFSET ?';
  queryParams.push(pageSize, offset);
  // 先查总数
  db.query(countSql, countParams, (err, countRes) => {
    if (err) {
      console.error('查询总数失败:', err);
      return res.json({ code: 500, msg: '服务器错误', data: null });
    }
    const total = countRes[0].total;
    // 再查分页数据
    db.query(querySql, queryParams, (err, listRes) => {
      if (err) {
        console.error('查询商品列表失败:', err);
        return res.json({ code: 500, msg: '服务器错误', data: null });
      }
      res.json({
        code: 200,
        msg: '获取成功',
        data: {
          list: listRes,
          total: total,
          page: page,
          pageSize: pageSize,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    });
  });
});

// ==========【模块4新增：获取商品详情 GET /api/goods/:id】==========
router.get('/:id', optionalAuth, (req, res) => {
  const goodsId = req.params.id;
  const userId = req.userId || null;
  if (!/^\d+$/.test(goodsId) ||
      !Number.isSafeInteger(Number(goodsId)) || Number(goodsId) < 1) {
    return res.json({ code: 400, msg: '商品ID无效', data: null });
  }

  const sql = `
    SELECT g.*, u.nickname, u.avatar
    FROM goods g
    LEFT JOIN users u ON g.user_id = u.id
    WHERE g.id = ? AND g.status = 1
  `;
  db.query(sql, [goodsId], (err, result) => {
    if (err) {
      console.error("查询商品详情错误", err);
      return res.json({ code: 500, msg: "服务器错误", data: null });
    }
    if (result.length === 0) {
      return res.json({ code: 404, msg: "商品不存在或已下架", data: null });
    }
    const goods = result[0];
    // 判断是否收藏
    if (userId) {
      const collectSql = `SELECT id FROM collect WHERE user_id=? AND goods_id=?`;
      db.query(collectSql, [userId, goodsId], (err, collectRes) => {
        if (err) {
          console.error('查询商品收藏状态失败:', err);
          return res.json({ code: 500, msg: '服务器错误', data: null });
        }
        goods.isCollect = collectRes.length > 0;
        return res.json({ code: 200, msg: "获取成功", data: goods });
      });
    } else {
      goods.isCollect = false;
      return res.json({ code: 200, msg: "获取成功", data: goods });
    }
  });
});

module.exports = router;