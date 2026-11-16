/**
 * 多账号本地管理（登录页"常用账号"功能）
 *
 * 设计说明：
 * - 保存在 uni storage 的 saved_accounts 里（最多 10 个，按最近登录排序）
 * - 每个账号保存：username、nickname、avatar、user、token、lastLoginAt
 * - token 是 JWT（7 天有效），因此已保存的账号可直接"一键切换登录"，无需再输密码
 * - 切换时若检测到 token 已失效，会提示重新输入密码（届时自动从列表移除该账号）
 *
 * 注意：token 存于本地 storage，仅用于本机免密切换；这是课程项目常见做法，
 *       请勿在他人设备上登录，或使用后点击"管理"删除账号。
 */
const STORAGE_KEY = 'saved_accounts'
const MAX_ACCOUNTS = 10
const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function readAll() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    if (!raw) return []
    const list = Array.isArray(raw) ? raw : JSON.parse(raw)
    if (!Array.isArray(list)) return []
    return list.filter((a) => a && a.username && a.token)
  } catch (e) {
    return []
  }
}

function writeAll(list) {
  uni.setStorageSync(STORAGE_KEY, list.slice(0, MAX_ACCOUNTS))
}

/** 账号列表（最近登录的在前） */
export function listAccounts() {
  return readAll().sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0))
}

/** 登录/注册成功后保存账号（同用户名覆盖，置顶） */
export function saveAccount(token, user) {
  if (!token || !user || !user.username) return listAccounts()
  const list = readAll().filter((a) => a.username !== user.username)
  list.unshift({
    username: user.username,
    nickname: user.nickname || user.username,
    avatar: user.avatar || '',
    user,
    token,
    lastLoginAt: Date.now()
  })
  writeAll(list)
  return listAccounts()
}

/** 删除某个账号 */
export function removeAccount(username) {
  writeAll(readAll().filter((a) => a.username !== username))
  return listAccounts()
}

/** 当前登录用户名（未登录返回空串） */
export function getCurrentUsername() {
  const u = uni.getStorageSync(USER_KEY)
  return u && u.username ? u.username : ''
}

/** 当前登录用户对象（未登录返回 null） */
export function getCurrentUser() {
  const u = uni.getStorageSync(USER_KEY)
  return u && u.username ? u : null
}

/**
 * 切换到指定账号：
 * - 写入该账号的 token / user 作为当前登录态
 * - 更新该账号最近登录时间
 */
export function switchTo(account) {
  if (!account || !account.token) return false
  uni.setStorageSync(TOKEN_KEY, account.token)
  uni.setStorageSync(USER_KEY, account.user)
  const list = readAll().map((a) =>
    a.username === account.username ? { ...a, lastLoginAt: Date.now() } : a
  )
  writeAll(list)
  return true
}

/** 清空全部已保存账号 */
export function clearAllAccounts() {
  writeAll([])
}
