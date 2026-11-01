/**
 * 校园闲置物品交易小程序 - 后端服务入口
 * 模块2：闲置商品发布、图片上传（feature/lisi-publish）
 *
 * 启动步骤：
 *   1. 复制 .env.example 为 .env，填写自己的数据库账号密码
 *   2. 执行 sql/init.sql 初始化数据库（见 README）
 *   3. npm install
 *   4. node app.js
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// 兜底：避免未处理的 Promise 拒绝（如数据库暂时不可用）导致进程崩溃
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

const goodsRoutes = require('./routes/goods');

const app = express();
const PORT = process.env.PORT || 3000;

// 跨域与请求体解析
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 上传图片的静态访问地址：http://localhost:3000/uploads/xxx.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 业务路由（合并到团队仓库后，其他成员的路由在此继续追加）
app.use('/api', goodsRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { time: new Date().toISOString() } });
});

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error('[error]', err);
  const status = err.status || 500;
  res.status(status).json({ code: status, message: err.message || '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`校园闲置交易后端已启动：http://localhost:${PORT}`);
});
