#!/usr/bin/env node
/**
 * 环境体检：下载项目后先跑这个，缺什么会直接告诉你怎么补
 *
 * 用法：node scripts/doctor.cjs
 * 退出码 0 = 可以直接启动；1 = 有阻塞项
 */
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');

const ROOT = path.join(__dirname, '..');
const SERVER = path.join(ROOT, 'server');
module.paths.push(path.join(SERVER, 'node_modules'));

const rows = [];
function check(name, ok, detail = '', fix = '') {
  rows.push({ name, ok, detail, fix });
}

function readEnv() {
  const p = path.join(SERVER, '.env');
  if (!fs.existsSync(p)) return null;
  const env = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

function portFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once('error', () => resolve(false));
    s.once('listening', () => s.close(() => resolve(true)));
    s.listen(port, '127.0.0.1');
  });
}

(async () => {
  // 1. Node 版本
  const major = Number(process.versions.node.split('.')[0]);
  check(`Node.js 版本 ${process.versions.node}`, major >= 18, '需要 18 及以上', '到 nodejs.org 装 LTS 版');

  // 2. 依赖
  const hasDeps = fs.existsSync(path.join(SERVER, 'node_modules', 'express'));
  check('后端依赖已安装', hasDeps, hasDeps ? 'server/node_modules 存在' : '缺 server/node_modules',
    'cd server && npm install --registry=https://registry.npmmirror.com');

  // 3. 配置
  const env = readEnv();
  check('server/.env 配置', Boolean(env), env ? '已存在' : '还没有 .env',
    'node scripts/setup-db.cjs（会自动生成）');
  check('JWT_SECRET 已设置', Boolean(env && env.JWT_SECRET), env?.JWT_SECRET ? '已配置' : '缺失',
    '在 server/.env 里补 JWT_SECRET=任意长字符串');

  // 4. 数据库
  let dbOk = false;
  let dbDetail = '';
  let goodsCount = null;
  if (hasDeps && env) {
    try {
      const mysql = require('mysql2/promise');
      const conn = await mysql.createConnection({
        host: env.DB_HOST || '127.0.0.1',
        port: Number(env.DB_PORT || 3306),
        user: env.DB_USER || 'root',
        password: env.DB_PASSWORD || '',
        database: env.DB_NAME || 'campus_secondhand',
      });
      const [r] = await conn.query('SELECT COUNT(*) AS n FROM goods');
      goodsCount = r[0].n;
      dbOk = true;
      dbDetail = `已连上 ${env.DB_NAME || 'campus_secondhand'}，商品 ${goodsCount} 件`;
      await conn.end();
    } catch (err) {
      dbDetail = err.code === 'ECONNREFUSED' ? 'MySQL 未启动'
        : err.code === 'ER_BAD_DB_ERROR' ? '库还没建'
          : err.code === 'ER_ACCESS_DENIED_ERROR' ? '数据库密码不对'
            : err.message;
    }
  }
  check('数据库可用', dbOk, dbDetail, 'node scripts/setup-db.cjs');

  // 5. 端口
  const port = Number(env?.PORT || 3000);
  const free = await portFree(port);
  check(`端口 ${port}`, true, free ? '空闲' : '已被占用（可能后端已经启动了）',
    'taskkill 掉占用进程，或改 server/.env 的 PORT');

  // 输出
  console.log('\n环境体检结果：\n');
  for (const r of rows) {
    console.log(`  ${r.ok ? '✔' : '×'}  ${r.name}  —  ${r.detail}`);
    if (!r.ok && r.fix) console.log(`      → ${r.fix}`);
  }
  const bad = rows.filter((r) => !r.ok);
  console.log(bad.length ? `\n还有 ${bad.length} 项要处理，按上面的 → 做即可。` : '\n全部就绪：cd server && node app.js');
  process.exit(bad.length ? 1 : 0);
})();
