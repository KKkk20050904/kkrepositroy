const express = require('express');
const router = express.Router();

const { register, login, getMe, updateMe, changePassword } = require('../controllers/authController');
const { authRequired } = require('../middleware/auth');

// 用户注册（注册成功自动登录）
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 获取当前登录用户信息（需登录）
router.get('/me', authRequired, getMe);

// 更新个人信息（需登录）
router.put('/me', authRequired, updateMe);

// 修改密码（需登录）
router.put('/password', authRequired, changePassword);

module.exports = router;
