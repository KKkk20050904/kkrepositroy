// 数据库连接配置（mysql2 连接池）
// 修改成自己本机的 MySQL 账号密码即可

const mysql = require('mysql2/promise')

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '123456',     // 改成自己的 MySQL 密码
  database: 'campus_secondhand',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

module.exports = pool
