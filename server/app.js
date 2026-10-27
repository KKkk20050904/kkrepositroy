require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const msgRoutes = require('./routes/msg');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { status: 'up', time: new Date().toISOString() }
  });
});

// 第一部分：用户登录注册模块
app.use('/api/auth', authRoutes);
app.use('/api/msg', msgRoutes);

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: 1006, message: '接口不存在' });
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ code: 1005, message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`✅ 后端服务已启动: http://localhost:${PORT}`);
  console.log('📌 接口列表:');
  console.log('   POST /api/auth/register  用户注册');
  console.log('   POST /api/auth/login     用户登录');
  console.log('   GET  /api/auth/me        获取当前用户信息（需登录）');
  console.log('   PUT  /api/auth/me        更新个人信息（需登录）');
  console.log('   GET  /api/msg            获取与用户的聊天记录（需登录）');
  console.log('   POST /api/msg            发送私信（需登录）');
});
