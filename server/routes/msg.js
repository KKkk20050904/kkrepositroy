const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_PAGE_SIZE = 50;
const POLL_PAGE_SIZE = 100;

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get('/', authRequired, async (req, res, next) => {
  const peerId = parsePositiveId(req.query.peerId);
  const afterId = req.query.afterId === undefined ? 0 : Number(req.query.afterId);

  if (!peerId || peerId === req.userId || !Number.isSafeInteger(afterId) || afterId < 0) {
    return res.status(400).json({ code: 1001, message: '聊天对象或消息游标无效' });
  }

  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [peerId]);
    if (users.length === 0) {
      return res.status(404).json({ code: 1003, message: '用户不存在' });
    }

    const isInitialLoad = afterId === 0;
    const [rows] = await pool.execute(
      `SELECT id, sender_id AS senderId, receiver_id AS receiverId, content,
              created_at AS createdAt
       FROM messages
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
         AND (? = 0 OR id > ?)
       ORDER BY id ${isInitialLoad ? 'DESC' : 'ASC'}
       LIMIT ?`,
      [req.userId, peerId, peerId, req.userId, afterId, afterId, isInitialLoad ? HISTORY_PAGE_SIZE : POLL_PAGE_SIZE],
    );

    res.json({
      code: 0,
      message: '获取成功',
      data: { list: isInitialLoad ? rows.reverse() : rows },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authRequired, async (req, res, next) => {
  const receiverId = parsePositiveId(req.body?.receiverId);
  const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';

  if (!receiverId || receiverId === req.userId || !content || content.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      code: 1001,
      message: `收件人无效，或消息内容为空/超过 ${MAX_MESSAGE_LENGTH} 个字符`,
    });
  }

  try {
    const [users] = await pool.execute('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (users.length === 0) {
      return res.status(404).json({ code: 1003, message: '收件人不存在' });
    }

    const [result] = await pool.execute(
      'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
      [req.userId, receiverId, content],
    );
    const [rows] = await pool.execute(
      `SELECT id, sender_id AS senderId, receiver_id AS receiverId, content,
              created_at AS createdAt
       FROM messages WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({ code: 0, message: '发送成功', data: rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
