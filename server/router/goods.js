// 商品模块路由（王五）
// GET /api/goods  商品列表（搜索、分类、分页）

const express = require('express')
const router = express.Router()
const goodsController = require('../controller/goodsController')

// 列表接口（注意：列表页是公开接口，不需要登录校验）
router.get('/', goodsController.list)

module.exports = router
