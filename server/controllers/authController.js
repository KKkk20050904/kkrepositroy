const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// ---------- 校验规则 ----------

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/; // 3-30 位字母/数字/下划线
const PHONE_RE = /^1\d{10}$/; // 11 位手机号
const EMAIL_RE = /^[\w.-]+@[\w-]+(\.[\w-]+)+$/;
const PASSWORD_MAX = 72; // bcrypt 输入上限

// 登录防爆破：同一用户名连续失败 5 次，锁定 5 分钟（内存实现，重启失效）
const MAX_FAILS = 5;
const LOCK_MINUTES = 5;
const loginFails = new Map(); // username -> { count, lockedUntil }

function checkLocked(username) {
  const rec = loginFails.get(username);
  if (!rec) return false;
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
    const leftMin = Math.ceil((rec.lockedUntil - Date.now()) / 60000);
    return { leftMin };
  }
  return false;
}

function recordFail(username) {
  const rec = loginFails.get(username) || { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_FAILS) {
    rec.lockedUntil = Date.now() + LOCK_MINUTES * 60000;
    rec.count = 0;
  }
  loginFails.set(username, rec);
}

function clearFails(username) {
  loginFails.delete(username);
}

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

// 校验手机号/邮箱（为空或未传则跳过）
function validateContact(phone, email) {
  if (phone && !PHONE_RE.test(String(phone))) {
    return { ok: false, message: '手机号格式不正确' };
  }
  if (email && !EMAIL_RE.test(String(email))) {
    return { ok: false, message: '邮箱格式不正确' };
  }
  return { ok: true };
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
    if (!USERNAME_RE.test(String(username))) {
      return res.status(400).json({ code: 1001, message: '用户名需为 3-30 位字母、数字或下划线' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ code: 1001, message: '密码长度不能少于 6 位' });
    }
    if (String(password).length > PASSWORD_MAX) {
      return res.status(400).json({ code: 1001, message: `密码长度不能超过 ${PASSWORD_MAX} 位` });
    }
    if (nickname && String(nickname).length > 30) {
      return res.status(400).json({ code: 1001, message: '昵称长度不能超过 30 个字符' });
    }
    const contact = validateContact(phone, email);
    if (!contact.ok) {
      return res.status(400).json({ code: 1001, message: contact.message });
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

    // 防爆破：检查是否被锁定
    const locked = checkLocked(String(username));
    if (locked) {
      return res.status(429).json({
        code: 1007,
        message: `尝试次数过多，账号已锁定，请 ${locked.leftMin} 分钟后再试`
      });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      recordFail(String(username));
      return res.status(401).json({ code: 1003, message: '用户名或密码错误' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      recordFail(String(username));
      return res.status(401).json({ code: 1003, message: '用户名或密码错误' });
    }

    clearFails(String(username));
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

    if (nickname !== undefined) {
      if (String(nickname).length > 30) {
        return res.status(400).json({ code: 1001, message: '昵称长度不能超过 30 个字符' });
      }
      fields.push('nickname = ?');
      values.push(nickname);
    }
    if (avatar !== undefined) {
      if (String(avatar).length > 255) {
        return res.status(400).json({ code: 1001, message: '头像地址过长' });
      }
      fields.push('avatar = ?');
      values.push(avatar);
    }
    if (phone !== undefined) {
      if (phone && !PHONE_RE.test(String(phone))) {
        return res.status(400).json({ code: 1001, message: '手机号格式不正确' });
      }
      fields.push('phone = ?');
      values.push(phone || null);
    }
    if (email !== undefined) {
      if (email && !EMAIL_RE.test(String(email))) {
        return res.status(400).json({ code: 1001, message: '邮箱格式不正确' });
      }
      fields.push('email = ?');
      values.push(email || null);
    }
    if (student_id !== undefined) {
      if (String(student_id).length > 30) {
        return res.status(400).json({ code: 1001, message: '学号长度不能超过 30 个字符' });
      }
      fields.push('student_id = ?');
      values.push(student_id || null);
    }

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
