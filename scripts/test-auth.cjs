/**
 * 模块1（张三）：用户登录注册、个人信息管理 —— 接口自动化测试
 * 前置：MySQL 已建库建表（server/db/schema.sql），后端已启动（node app.js）
 * 用法：node scripts/test-auth.cjs
 */
const BASE = 'http://127.0.0.1:3000';

let pass = 0;
let fail = 0;

function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}  => ${detail}`);
  }
}

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, ...json };
}

async function main() {
  const uname = 'test' + Date.now().toString().slice(-8);

  // 1. 注册（带中文昵称 + 手机号 + 邮箱）
  let r = await req('POST', '/api/auth/register', {
    username: uname, password: '123456', nickname: '测试小张',
    phone: '13800138000', email: 'test@school.edu.cn'
  });
  check('注册成功 status=201 code=0', r.status === 201 && r.code === 0, `${r.status}/${r.code}`);
  check('注册返回 token', typeof r.data?.token === 'string' && r.data.token.length > 50, JSON.stringify(r.data));
  check('中文昵称原样返回', r.data?.user?.nickname === '测试小张', JSON.stringify(r.data?.user));
  check('手机号/邮箱已保存', r.data?.user?.phone === '13800138000' && r.data?.user?.email === 'test@school.edu.cn', JSON.stringify(r.data?.user));
  check('返回不含密码字段', !('password' in (r.data?.user || {})), JSON.stringify(r.data?.user));
  const token = r.data?.token;

  // 2. 重复注册
  r = await req('POST', '/api/auth/register', { username: uname, password: '123456' });
  check('重复注册 400 + 1002', r.status === 400 && r.code === 1002, `${r.status}/${r.code}/${r.message}`);

  // 3. 参数校验
  r = await req('POST', '/api/auth/register', { username: 'a', password: '123456' });
  check('用户名过短 400 + 1001', r.status === 400 && r.code === 1001, `${r.status}/${r.code}`);
  r = await req('POST', '/api/auth/register', { username: 'okname', password: '123' });
  check('密码过短 400 + 1001', r.status === 400 && r.code === 1001, `${r.status}/${r.code}`);
  r = await req('POST', '/api/auth/register', { username: 'okname2', password: '123456', phone: '12345' });
  check('手机号非法 400 + 1001', r.status === 400 && r.code === 1001, `${r.status}/${r.code}`);
  r = await req('POST', '/api/auth/register', { username: 'okname3', password: '123456', email: 'bad-email' });
  check('邮箱非法 400 + 1001', r.status === 400 && r.code === 1001, `${r.status}/${r.code}`);

  // 4. 登录错误密码 / 不存在用户
  r = await req('POST', '/api/auth/login', { username: uname, password: 'wrongpass' });
  check('错误密码 401 + 1003', r.status === 401 && r.code === 1003, `${r.status}/${r.code}/${r.message}`);
  r = await req('POST', '/api/auth/login', { username: 'no_such_user', password: '123456' });
  check('不存在用户 401 + 1003', r.status === 401 && r.code === 1003, `${r.status}/${r.code}`);

  // 5. 登录成功
  r = await req('POST', '/api/auth/login', { username: uname, password: '123456' });
  check('登录成功 code=0', r.code === 0, JSON.stringify(r));
  check('登录返回用户信息', r.data?.user?.username === uname, JSON.stringify(r.data));
  const token2 = r.data?.token;

  // 6. 无 token / 伪造 token 访问个人信息
  r = await req('GET', '/api/auth/me');
  check('无 token 401 + 1004', r.status === 401 && r.code === 1004, `${r.status}/${r.code}`);
  r = await req('GET', '/api/auth/me', null, 'bad.token.here');
  check('伪造 token 401 + 1004', r.status === 401 && r.code === 1004, `${r.status}/${r.code}`);

  // 7. 带 token 获取个人信息
  r = await req('GET', '/api/auth/me', null, token);
  check('获取个人信息成功 data.user', r.code === 0 && r.data?.user?.username === uname, JSON.stringify(r));

  // 8. 修改个人信息（中文昵称 + 学号）
  r = await req('PUT', '/api/auth/me', { nickname: '新昵称呀', student_id: '20230001' }, token);
  check('修改昵称/学号成功', r.code === 0 && r.data?.user?.nickname === '新昵称呀' && r.data?.user?.student_id === '20230001', JSON.stringify(r.data));

  // 9. 非法手机号 / 空修改
  r = await req('PUT', '/api/auth/me', { phone: '12345' }, token);
  check('非法手机号 400 + 1001', r.status === 400 && r.code === 1001, `${r.status}/${r.code}/${r.message}`);
  r = await req('PUT', '/api/auth/me', {}, token);
  check('空修改 400 + 1001', r.status === 400 && r.code === 1001, `${r.status}/${r.code}`);

  // 10. 改密：原密码错误
  r = await req('PUT', '/api/auth/password', { oldPassword: 'wrong', newPassword: 'newpass123' }, token);
  check('原密码错误 401 + 1003', r.status === 401 && r.code === 1003, `${r.status}/${r.code}/${r.message}`);

  // 11. 改密成功，新密码可登录、旧密码失效
  r = await req('PUT', '/api/auth/password', { oldPassword: '123456', newPassword: 'newpass123' }, token);
  check('改密成功 code=0', r.code === 0, JSON.stringify(r));
  r = await req('POST', '/api/auth/login', { username: uname, password: 'newpass123' });
  check('新密码可登录', r.code === 0, JSON.stringify(r));
  r = await req('POST', '/api/auth/login', { username: uname, password: '123456' });
  check('旧密码已失效', r.status === 401, `${r.status}/${r.code}`);

  // 12. 登录防爆破：专用账号连续输错 5 次后触发锁定
  const lockUser = 'locktest' + Date.now().toString().slice(-6);
  await req('POST', '/api/auth/register', { username: lockUser, password: '123456' });
  let fifth = null;
  for (let i = 0; i < 5; i++) {
    fifth = await req('POST', '/api/auth/login', { username: lockUser, password: 'badpass' });
  }
  check('第5次失败本身仍返回 401（锁定在失败后生效）', fifth.status === 401 && fifth.code === 1003, `${fifth.status}/${fifth.code}`);
  r = await req('POST', '/api/auth/login', { username: lockUser, password: '123456' });
  check('第6次起即使密码正确也返回 429 + 1007', r.status === 429 && r.code === 1007, `${r.status}/${r.code}/${r.message}`);

  // 13. 改密后的旧 token 仍可访问（JWT 无状态，预期行为）
  r = await req('GET', '/api/auth/me', null, token2);
  check('旧 token 仍可访问（预期行为）', r.code === 0, JSON.stringify(r));

  // 14. 404 统一格式
  r = await req('GET', '/api/not-exist');
  check('404 统一格式 1006', r.status === 404 && r.code === 1006, `${r.status}/${r.code}`);

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('测试执行异常:', e);
  process.exit(1);
});
