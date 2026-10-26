const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ---------- 工具函数 ----------

// 生成 JWT
function signToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 去掉密码等敏感字段后再返回
function safeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// ---------- 接口实现 ----------

/**
 * 用户注册
 * POST /api/auth/register
 * body: { username, password, nickname?, phone?, email?, student_id? }
 */
async function register(req, res) {
  try {
    const { username, password, nickname, phone, email, student_id } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ code: 1001, message: '用户名和密码不能为空' });
    }
    if (String(username).length > 30) {
      return res.status(400).json({ code: 1001, message: '用户名长度不能超过 30 个字符' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ code: 1001, message: '密码长度不能少于 6 位' });
    }

    // 检查用户名是否已存在
    const [exists] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (exists.length > 0) {
      return res.status(400).json({ code: 1002, message: '用户名已存在' });
    }

    // 密码加密存储
    const hash = await bcrypt.hash(String(password), 10);

    const [result] = await pool.query(
      `INSERT INTO users (username, nickname, password, phone, email, student_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, nickname || username, hash, phone || null, email || null, student_id || null]
    );

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const user = rows[0];

    // 注册成功即自动登录，返回 token
    res.status(201).json({
      code: 0,
      message: '注册成功',
      data: { token: signToken(user), user: safeUser(user) }
    });
  } catch (err) {
    console.error('[register] error:', err);
    res.status(500).json({ code: 1005, message: '服务器内部错误' });
  }
}

/**
 * 用户登录
 * POST /api/auth/login
 * body: { username, password }
 */
async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ code: 1001, message: '用户名和密码不能为空' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ code: 1003, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ code: 1003, message: '用户名或密码错误' });
    }

    res.json({
      code: 0,
      message: '登录成功',
      data: { token: signToken(user), user: safeUser(user) }
    });
  } catch (err) {
    console.error('[login] error:', err);
    res.status(500).json({ code: 1005, message: '服务器内部错误' });
  }
}

/**
 * 获取当前登录用户信息
 * GET /api/auth/me   （需登录）
 */
async function getMe(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (rows.length === 0) {
      return res.status(404).json({ code: 1003, message: '用户不存在' });
    }
    res.json({ code: 0, message: 'ok', data: { user: safeUser(rows[0]) } });
  } catch (err) {
    console.error('[getMe] error:', err);
    res.status(500).json({ code: 1005, message: '服务器内部错误' });
  }
}

/**
 * 更新个人信息
 * PUT /api/auth/me   （需登录）
 * body: { nickname?, avatar?, phone?, email?, student_id? }
 */
async function updateMe(req, res) {
  try {
    const { nickname, avatar, phone, email, student_id } = req.body || {};
    const fields = [];
    const values = [];

    if (nickname !== undefined) { fields.push('nickname = ?'); values.push(nickname); }
    if (avatar !== undefined) { fields.push('avatar = ?'); values.push(avatar); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone); }
    if (email !== undefined) { fields.push('email = ?'); values.push(email); }
    if (student_id !== undefined) { fields.push('student_id = ?'); values.push(student_id); }

    if (fields.length === 0) {
      return res.status(400).json({ code: 1001, message: '没有需要更新的字段' });
    }

    values.push(req.userId);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.userId]);
    res.json({ code: 0, message: '更新成功', data: { user: safeUser(rows[0]) } });
  } catch (err) {
    console.error('[updateMe] error:', err);
    res.status(500).json({ code: 1005, message: '服务器内部错误' });
  }
}

module.exports = { register, login, getMe, updateMe };
