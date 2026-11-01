// 商品列表模块 - 控制器（王五）
// 对外接口：GET /api/goods
// 支持参数：
//   keyword      关键词搜索（匹配标题/描述，模糊查询）
//   category_id  分类筛选（0 或不传 = 全部）
//   page         页码，从 1 开始
//   pageSize     每页条数，默认 10，最大 50

const pool = require('../config/db')

exports.list = async (req, res) => {
  try {
    // ---------- 1. 解析并校验参数 ----------
    const keyword = (req.query.keyword || '').trim()
    const categoryId = parseInt(req.query.category_id) || 0
    const page = Math.max(parseInt(req.query.page) || 1, 1)          // 页码最小为 1
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 50) // 每页 1~50
    const offset = (page - 1) * pageSize                             // LIMIT 偏移量

    // ---------- 2. 动态拼接查询条件（防 SQL 注入：参数一律用 ? 占位） ----------
    const where = ['g.status = 0'] // 默认只查上架商品
    const params = []

    if (keyword) {
      where.push('(g.title LIKE ? OR g.description LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }
    if (categoryId > 0) {
      where.push('g.category_id = ?')
      params.push(categoryId)
    }
    const whereSql = 'WHERE ' + where.join(' AND ')

    // ---------- 3. 查询总数（用于前端判断"还有没有下一页"） ----------
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM goods g ${whereSql}`,
      params
    )
    const total = countRows[0].total

    // ---------- 4. 查询当前页商品（联表拿分类名和卖家信息） ----------
    const [rows] = await pool.query(
      `SELECT g.id, g.title, g.price, g.description, g.images,
              g.category_id, g.user_id, g.status, g.create_time,
              c.name AS category_name,
              u.username AS seller_name, u.avatar AS seller_avatar
       FROM goods g
       LEFT JOIN category c ON g.category_id = c.id
       LEFT JOIN user u ON g.user_id = u.id
       ${whereSql}
       ORDER BY g.create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, pageSize, offset]
    )

    // ---------- 5. 处理封面图：images 逗号分隔，前端取第一张 ----------
    const list = rows.map(item => ({
      ...item,
      cover: item.images ? item.images.split(',')[0] : ''
    }))

    // ---------- 6. 统一返回结构（各模块约定：code 0 为成功） ----------
    res.json({
      code: 0,
      message: 'success',
      data: {
        list,
        total,
        page,
        pageSize,
        hasMore: offset + list.length < total
      }
    })
  } catch (e) {
    console.error('查询商品列表失败:', e)
    res.status(500).json({ code: 500, message: '服务器错误' })
  }
}
