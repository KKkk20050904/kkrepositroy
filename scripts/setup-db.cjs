#!/usr/bin/env node
/**
 * 一键把数据库准备好（谁下载都能跑）
 *
 * 做的事：
 *   1. 没有 server/.env 就用模板生成一份（默认 root / 123456，与课程环境一致）
 *   2. 连上 MySQL，建库 campus_secondhand
 *   3. 执行 server/sql/init.sql 建表 + 分类种子
 *   3.5 导入 server/sql/seed-goods.sql（12 件示例商品，有就导）
 *   4. 去掉重复的分类（init.sql 的种子不是幂等的，跑第二遍会出现重复行）
 *
 * 用法（在仓库根目录）：
 *   node scripts/setup-db.cjs
 * 数据库密码不同时：
 *   DB_PASSWORD=你的密码 node scripts/setup-db.cjs
 *   （或者直接改 server/.env）
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SERVER = path.join(ROOT, 'server');
const ENV_PATH = path.join(SERVER, '.env');
const SQL_PATH = path.join(SERVER, 'sql', 'init.sql');

module.paths.push(path.join(SERVER, 'node_modules'));

function log(msg) { console.log(msg); }
function die(msg) { console.error('\n[失败] ' + msg); process.exit(1); }

// ---------- 1. 准备 .env ----------
function ensureEnv() {
  if (fs.existsSync(ENV_PATH)) {
    log('· server/.env 已存在，沿用其中配置');
    return;
  }
  const example = path.join(SERVER, '.env.example');
  let text = fs.readFileSync(example, 'utf8');
  const password = process.env.DB_PASSWORD || '123456';
  text = text.replace('你的数据库密码', password);
  fs.writeFileSync(ENV_PATH, text, 'utf8');
  log(`· 已生成 server/.env（数据库密码用 ${password}，如不对请自行修改）`);
}

// ---------- 2. 读取配置 ----------
function readEnv() {
  const text = fs.readFileSync(ENV_PATH, 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || env.DB_PASSWORD || '',
    database: process.env.DB_NAME || env.DB_NAME || 'campus_secondhand',
  };
}

(async () => {
  ensureEnv();

  let mysql;
  try {
    mysql = require('mysql2/promise');
  } catch {
    die('还没装依赖。先在 server 目录执行：npm install --registry=https://registry.npmmirror.com');
  }

  const cfg = readEnv();
  log(`· 连接 MySQL ${cfg.user}@${cfg.host}:${cfg.port}`);

  let conn;
  try {
    conn = await mysql.createConnection({
      host: cfg.host, port: cfg.port, user: cfg.user, password: cfg.password,
      multipleStatements: true,
    });
  } catch (err) {
    const hint = err.code === 'ECONNREFUSED'
      ? 'MySQL 没有启动：请在服务里启动 MySQL，或执行 mysqld --datadir=<数据目录>'
      : err.code === 'ER_ACCESS_DENIED_ERROR'
        ? '密码不对：改 server/.env 里的 DB_PASSWORD，或运行 DB_PASSWORD=你的密码 node scripts/setup-db.cjs'
        : err.message;
    die('连不上 MySQL → ' + hint);
  }

  // ---------- 3. 建库 + 建表 ----------
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${cfg.database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.query(`USE \`${cfg.database}\``);

  const sql = fs.readFileSync(SQL_PATH, 'utf8');
  await conn.query(sql);
  log('· 已执行 server/sql/init.sql（建表 + 分类种子）');

  // 示例商品（12 件）：让“建完库首页就有东西”，不必再跑 seed-goods.cjs
  const seedPath = path.join(SERVER, 'sql', 'seed-goods.sql');
  if (fs.existsSync(seedPath)) {
    await conn.query(fs.readFileSync(seedPath, 'utf8'));
    log('· 已导入示例商品 server/sql/seed-goods.sql');
  }

  // ---------- 4. 清理重复分类 ----------
  const [dup] = await conn.query(
    'DELETE c1 FROM category c1 JOIN category c2 ON c1.name = c2.name AND c1.id > c2.id'
  );
  if (dup.affectedRows) log(`· 清掉 ${dup.affectedRows} 条重复分类`);

  // ---------- 5. 汇报 ----------
  const [[{ tables }]] = await conn.query(
    'SELECT COUNT(*) AS tables FROM information_schema.tables WHERE table_schema = ?', [cfg.database]
  );
  const [[{ cats }]] = await conn.query('SELECT COUNT(*) AS cats FROM category');
  const [[{ goods }]] = await conn.query('SELECT COUNT(*) AS goods FROM goods');
  const [[{ users }]] = await conn.query('SELECT COUNT(*) AS users FROM users');

  log(`\n[完成] 库 ${cfg.database}：${tables} 张表，${cats} 个分类，${goods} 件商品，${users} 个用户。`);
  log('下一步：cd server && node app.js    然后用 node scripts/smoke-test.cjs 自测');
  await conn.end();
})().catch((err) => die(err.message));
