// 统一的请求封装（登录注册模块使用）
// 注意：真机调试时，把 BASE_URL 换成电脑的局域网 IP，例如 http://192.168.x.x:3000
const BASE_URL = 'http://localhost:3000'

export function request(options) {
  return new Promise((resolve, reject) => {
    // 已登录时自动带上 token
    const token = uni.getStorageSync('token')
    const header = {
      'Content-Type': 'application/json',
      ...(options.header || {})
    }
    if (token) {
      header.Authorization = 'Bearer ' + token
    }

    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const body = res.data
          if (body && body.code === 0) {
            resolve(body.data)
          } else {
            const msg = (body && body.message) || '请求失败'
            uni.showToast({ title: msg, icon: 'none' })
            reject(body)
          }
        } else {
          const msg = (res.data && res.data.message) || '网络请求失败'
          uni.showToast({ title: msg, icon: 'none' })
          reject(res)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络连接失败，请检查后端服务是否已启动', icon: 'none' })
        reject(err)
      }
    })
  })
}

export function setToken(token) {
  uni.setStorageSync('token', token)
}

export function setUser(user) {
  uni.setStorageSync('user', user)
}

export function getUser() {
  return uni.getStorageSync('user') || null
}

export function clearAuth() {
  uni.removeStorageSync('token')
  uni.removeStorageSync('user')
}
