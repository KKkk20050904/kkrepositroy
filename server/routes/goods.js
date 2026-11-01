/**
 * 商品相关路由（模块2：闲置商品发布、图片上传）
 * 挂载前缀：/api
 *
 * 接口清单：
 *   POST /api/upload  图片上传（需要登录）
 *   POST /api/goods   发布闲置商品（需要登录）
 *
 * 联调提示：登录模块完成前，可临时去掉下面的 auth 中间件，
 * 并在请求体里传 userId 来指定发布者。
 */
const express = require('express');
const router = express.Router();
const goodsController = require('../controllers/goodsController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_secondhand_secret_key';

// 图片上传：multipart/form-data，字段名 files
router.post('/upload', auth, upload.array('files', 9), goodsController.uploadImages);

// 发布闲置商品：JSON 请求体
router.post('/goods', auth, goodsController.createGoods);

// ============ 联调辅助接口（张三登录模块完成后请删除） ============
// 签发测试 token（发布者 id=1 test_user），供前端在登录模块未完成时联调发布功能
router.get('/dev/token', (req, res) => {
  const token = jwt.sign({ id: 1, username: 'test_user' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ code: 0, message: '联调token（仅开发用）', data: { token } });
});

module.exports = router;
