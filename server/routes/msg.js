const express = require('express');
const pool = require('../config/db');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
const MAX_MESSAGE_LENGTH = 2000;
const HISTORY_PAGE_SIZE = 50;
const POLL_PAGE_SIZE = 100;
const CONVERSATION_PAGE_SIZE = 100;
const CONTACT_PAGE_SIZE = 50;

function parsePositiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

router.get('/conversations', authRequired, async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT peer.id AS peerId,
              COALESCE(NULLIF(peer.nickname, ''), peer.username) AS name,
              peer.avatar,
              latest.content AS lastMessage,
              latest.created_at AS lastMessageAt,
              (SELECT COUNT(*) FROM messages unread
               WHERE unread.sender_id = peer.id
                 AND unread.receiver_id = ?
                 AND unread.is_read = 0) AS unreadCount
       FROM (
         SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS peer_id,
                MAX(id) AS last_id
         FROM messages
         WHERE sender_id = ? OR receiver_id = ?
         GROUP BY peer_id
       ) recent
       JOIN users peer ON peer.id = recent.peer_id
       JOIN messages latest ON latest.id = recent.last_id
       ORDER BY latest.id DESC
       LIMIT ?`,
      [req.userId, req.userId, req.userId, req.userId, CONVERSATION_PAGE_SIZE],
    );

    res.json({ code: 0, message: '获取成功', data: { list: rows } });
  } catch (error) {
    next(error);
  }
});

router.get('/contacts', authRequired, async (req, res, next) => {
  const keyword = typeof req.query.keyword === 'string' ? req.query.keyword.trim().slice(0, 60) : '';

  try {
    const search = `%${keyword}%`;
    const [rows] = await pool.execute(
      `SELECT id AS peerId, username, COALESCE(NULLIF(nickname, ''), username) AS name, avatar
       FROM users
       WHERE id <> ?
         AND (? = '' OR nickname LIKE ? OR username LIKE ?)
       ORDER BY nickname, username
       LIMIT ?`,
      [req.userId, keyword, search, search, CONTACT_PAGE_SIZE],
    );

    res.json({ code: 0, message: '获取成功', data: { list: rows } });
  } catch (error) {
    next(error);
  }
});

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
              is_read AS isRead, created_at AS createdAt
       FROM messages
       WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
         AND (? = 0 OR id > ?)
       ORDER BY id ${isInitialLoad ? 'DESC' : 'ASC'}
       LIMIT ?`,
      [req.userId, peerId, peerId, req.userId, afterId, afterId, isInitialLoad ? HISTORY_PAGE_SIZE : POLL_PAGE_SIZE],
    );

    const unreadIds = rows
      .filter((message) => Number(message.receiverId) === Number(req.userId) && !message.isRead)
      .map((message) => message.id);
    if (unreadIds.length) {
      await pool.execute(
        `UPDATE messages SET is_read = 1
         WHERE receiver_id = ? AND id IN (${unreadIds.map(() => '?').join(', ')})`,
        [req.userId, ...unreadIds],
      );
      rows.forEach((message) => {
        if (unreadIds.includes(message.id)) message.isRead = 1;
      });
    }

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
              is_read AS isRead, created_at AS createdAt
       FROM messages WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json({ code: 0, message: '发送成功', data: rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
