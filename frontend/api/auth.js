import { request } from '../common/request.js'

// 用户注册（注册成功自动登录，返回 token + user）
export function register(data) {
  return request({ url: '/api/auth/register', method: 'POST', data })
}

// 用户登录
export function login(data) {
  return request({ url: '/api/auth/login', method: 'POST', data })
}

// 获取当前用户信息（需登录）
export function getMe() {
  return request({ url: '/api/auth/me', method: 'GET' })
}

// 更新个人信息（需登录）
export function updateMe(data) {
  return request({ url: '/api/auth/me', method: 'PUT', data })
}
