<template>
  <view class="page">
    <!-- 顶部品牌渐变区 -->
    <view class="hero-bg">
      <view class="blob blob-a"></view>
      <view class="blob blob-b"></view>
      <view class="blob blob-c"></view>
      <view class="ring ring-a"></view>
      <view class="ring ring-b"></view>
    </view>

    <view class="hero">
      <view class="logo">
        <text class="logo-emoji">🛍</text>
      </view>
      <text class="app-name">校园闲置交易</text>
      <text class="app-slogan">让闲置流动起来 · 校园好物重获新生</text>
    </view>

    <!-- 登录卡片 -->
    <view class="card">
      <!-- 当前已登录提示 -->
      <view v-if="currentUser" class="logged-in">
        <view class="logged-in-info">
          <view class="logged-in-avatar">{{ initial(currentUser) }}</view>
          <view class="logged-in-text">
            <text class="logged-in-name">{{ currentUser.nickname || currentUser.username }}</text>
            <text class="logged-in-tip">当前已登录 · 可直接进入</text>
          </view>
        </view>
        <text class="go-home" @click="goHome">进入主页 ›</text>
      </view>

      <view class="card-head">
        <text class="card-title">欢迎回来 👋</text>
        <text class="card-desc">登录账号，继续你的校园好物之旅</text>
      </view>

      <!-- 用户名 -->
      <view class="field" :class="{ 'field-focus': focusField === 'username' }">
        <view class="field-icon">👤</view>
        <input
          class="input"
          v-model="form.username"
          placeholder="请输入用户名 / 学号"
          placeholder-class="ph"
          @focus="focusField = 'username'"
          @blur="focusField = ''"
          @confirm="handleLogin"
          :confirm-type="'done'"
        />
      </view>

      <!-- 密码 -->
      <view class="field" :class="{ 'field-focus': focusField === 'password' }">
        <view class="field-icon">🔒</view>
        <input
          class="input"
          v-model="form.password"
          :password="!showPwd"
          placeholder="请输入登录密码"
          placeholder-class="ph"
          @focus="focusField = 'password'"
          @blur="focusField = ''"
          @confirm="handleLogin"
          :confirm-type="'done'"
        />
        <view class="eye" @click="showPwd = !showPwd">
          <text>{{ showPwd ? '🙈' : '👁' }}</text>
        </view>
      </view>

      <!-- 记住账号 / 忘记密码 -->
      <view class="row-between">
        <view class="remember" @click="toggleRemember">
          <view class="check" :class="{ 'check-on': remember }">
            <text v-if="remember" class="check-mark">✓</text>
          </view>
          <text class="remember-text">记住账号</text>
        </view>
        <text class="forgot" @click="forgotPassword">忘记密码？</text>
      </view>

      <button
        class="btn-login"
        :class="{ 'btn-disabled': !canSubmit }"
        :loading="loading"
        :disabled="!canSubmit || loading"
        @click="handleLogin"
      >
        {{ loading ? '登录中…' : '登 录' }}
      </button>

      <view class="divider">
        <view class="line"></view>
        <text class="divider-text">还没有账号？</text>
        <view class="line"></view>
      </view>

      <button class="btn-register" @click="goRegister">立即注册</button>

      <!-- 常用账号（多账号快速切换） -->
      <view v-if="accounts.length" class="saved">
        <view class="saved-head">
          <text class="saved-title">常用账号 · {{ accounts.length }}</text>
          <text class="saved-manage" @click="managing = !managing">{{ managing ? '完成' : '管理' }}</text>
        </view>
        <scroll-view class="saved-list" scroll-x>
          <view
            v-for="acc in accounts"
            :key="acc.username"
            class="saved-item"
            :class="{ 'saved-current': acc.username === currentUsername }"
            @click="onSavedTap(acc)"
          >
            <view class="saved-avatar">{{ initial(acc) }}</view>
            <view class="saved-info">
              <text class="saved-name">{{ acc.nickname || acc.username }}</text>
              <text class="saved-user">@{{ acc.username }}</text>
            </view>
            <view v-if="managing" class="saved-del" @click.stop="onRemove(acc)">✕</view>
            <view v-else-if="acc.username === currentUsername" class="saved-badge">当前</view>
          </view>
        </scroll-view>
        <text class="saved-tip">{{ managing ? '点右上角「完成」退出管理' : '点账号卡片即可一键切换登录' }}</text>
      </view>

      <view class="guest-row">
        <text class="guest" @click="goBrowse">先随便逛逛校园好物 →</text>
      </view>
    </view>

    <view class="footer">
      <text>校园闲置交易 · 账号保存在本机，可随时切换</text>
    </view>
  </view>
</template>

<script>
import { login } from '../../api/auth.js'
import { setToken, setUser, clearAuth, BASE_URL } from '../../common/request.js'
import {
  listAccounts,
  saveAccount,
  removeAccount,
  switchTo,
  getCurrentUsername,
  getCurrentUser
} from '../../common/accounts.js'

const REMEMBER_KEY = 'remember_username'

export default {
  data() {
    return {
      loading: false,
      showPwd: false,
      remember: true,
      focusField: '',
      accounts: [],
      currentUser: null,
      currentUsername: '',
      managing: false,
      switching: false,
      form: {
        username: '',
        password: ''
      }
    }
  },
  computed: {
    canSubmit() {
      return this.form.username.trim() !== '' && this.form.password !== ''
    }
  },
  onLoad() {
    // 记住账号：进页面自动填充上次登录的用户名
    const saved = uni.getStorageSync(REMEMBER_KEY)
    if (saved) {
      this.form.username = saved
      this.remember = true
    }
    this.refreshAccounts()
    this.checkCurrent()
  },
  onShow() {
    // 从注册页返回等场景，刷新账号列表与登录态
    this.refreshAccounts()
    this.checkCurrent()
  },
  methods: {
    initial(obj) {
      const name = (obj && (obj.nickname || obj.username)) || ''
      return name ? name.slice(0, 1).toUpperCase() : '?'
    },
    refreshAccounts() {
      this.accounts = listAccounts()
      this.currentUsername = getCurrentUsername()
    },
    // 检查当前登录态是否有效（静默，不弹窗）
    checkCurrent() {
      const user = getCurrentUser()
      if (!user) {
        this.currentUser = null
        return
      }
      this.currentUser = user
      const token = uni.getStorageSync('token')
      if (!token) {
        this.currentUser = null
        return
      }
      uni.request({
        url: BASE_URL + '/api/auth/me',
        header: { Authorization: 'Bearer ' + token },
        success: (res) => {
          const body = res.data || {}
          if (res.statusCode === 200 && body.code === 0 && body.data && body.data.user) {
            this.currentUser = body.data.user
            this.currentUsername = body.data.user.username
            uni.setStorageSync('user', body.data.user)
          } else if (body.code === 1004) {
            // 登录态已失效：静默清理
            this.currentUser = null
            clearAuth()
          }
        },
        fail: () => {
          // 后端未启动时保持本地登录态，不打扰用户
        }
      })
    },
    toggleRemember() {
      this.remember = !this.remember
      if (!this.remember) uni.removeStorageSync(REMEMBER_KEY)
    },
    forgotPassword() {
      uni.showToast({ title: '请联系管理员重置密码', icon: 'none' })
    },
    goRegister() {
      uni.navigateTo({ url: '/pages/register/register' })
    },
    goBrowse() {
      uni.navigateTo({ url: '/pages/goods/list' })
    },
    goHome() {
      uni.reLaunch({ url: '/pages/index/index' })
    },
    // 点击已保存的账号
    onSavedTap(acc) {
      if (this.managing) return
      if (acc.username === this.currentUsername && this.currentUser) {
        uni.showToast({ title: '当前已登录该账号', icon: 'none' })
        return
      }
      this.switchAccount(acc)
    },
    // 一键切换账号：验证 token 后直接写入登录态
    switchAccount(acc) {
      if (this.switching) return
      this.switching = true
      uni.showLoading({ title: '切换账号中', mask: true })
      uni.request({
        url: BASE_URL + '/api/auth/me',
        header: { Authorization: 'Bearer ' + acc.token },
        success: (res) => {
          uni.hideLoading()
          const body = res.data || {}
          if (res.statusCode === 200 && body.code === 0 && body.data && body.data.user) {
            const user = body.data.user
            switchTo(acc)
            setUser(user)
            this.refreshAccounts()
            this.checkCurrent()
            uni.showToast({ title: '已切换到 ' + (user.nickname || user.username) })
            setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 700)
          } else if (body.code === 1004) {
            // 该账号登录已过期：从列表移除并提示重新输入密码
            removeAccount(acc.username)
            this.refreshAccounts()
            this.form.username = acc.username
            this.form.password = ''
            uni.showToast({ title: '该账号登录已过期，请重新输入密码', icon: 'none' })
          } else {
            uni.showToast({ title: body.message || '切换失败', icon: 'none' })
          }
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '网络异常，请检查后端服务', icon: 'none' })
        },
        complete: () => {
          this.switching = false
        }
      })
    },
    // 管理模式下删除账号
    onRemove(acc) {
      uni.showModal({
        title: '移除账号',
        content: `确定不再保存「${acc.nickname || acc.username}」吗？`,
        success: (r) => {
          if (!r.confirm) return
          removeAccount(acc.username)
          if (getCurrentUsername() === acc.username) {
            clearAuth()
            this.currentUser = null
            this.form.username = acc.username
          }
          this.refreshAccounts()
          uni.showToast({ title: '已移除', icon: 'none' })
        }
      })
    },
    handleLogin() {
      if (this.loading) return
      const { username, password } = this.form
      if (!username.trim()) {
        uni.showToast({ title: '请输入用户名', icon: 'none' })
        return
      }
      if (!password) {
        uni.showToast({ title: '请输入密码', icon: 'none' })
        return
      }
      this.loading = true
      login({ username: username.trim(), password })
        .then((data) => {
          if (this.remember) {
            uni.setStorageSync(REMEMBER_KEY, username.trim())
          } else {
            uni.removeStorageSync(REMEMBER_KEY)
          }
          setToken(data.token)
          setUser(data.user)
          // 保存到常用账号（多账号快速切换）
          saveAccount(data.token, data.user)
          this.refreshAccounts()
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack({
              fail: () => {
                uni.reLaunch({ url: '/pages/index/index' })
              }
            })
          }, 800)
        })
        .catch(() => {
          // 错误提示已由 request 统一处理
        })
        .then(() => {
          this.loading = false
        })
    }
  }
}
</script>

<style>
.page {
  position: relative;
  min-height: 100vh;
  background: #f4f6ff;
  overflow: hidden;
  padding-bottom: 60rpx;
  box-sizing: border-box;
}

/* ============ 顶部品牌区 ============ */
.hero-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 620rpx;
  background: linear-gradient(160deg, #2f4fd8 0%, #4f74f5 55%, #7ea1ff 100%);
  border-radius: 0 0 56rpx 56rpx;
  overflow: hidden;
}

.blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.35;
}
.blob-a {
  width: 340rpx;
  height: 340rpx;
  background: rgba(255, 255, 255, 0.22);
  top: -120rpx;
  right: -80rpx;
  filter: blur(6rpx);
}
.blob-b {
  width: 220rpx;
  height: 220rpx;
  background: rgba(122, 162, 255, 0.6);
  top: 220rpx;
  left: -90rpx;
  filter: blur(10rpx);
}
.blob-c {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.35);
  bottom: 40rpx;
  right: 120rpx;
  filter: blur(4rpx);
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.18);
}
.ring-a {
  width: 460rpx;
  height: 460rpx;
  top: -180rpx;
  left: -140rpx;
}
.ring-b {
  width: 300rpx;
  height: 300rpx;
  bottom: -120rpx;
  right: -60rpx;
}

.hero {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 96rpx;
}

.logo {
  width: 128rpx;
  height: 128rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.18);
  border: 2rpx solid rgba(255, 255, 255, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 40rpx rgba(20, 40, 120, 0.25);
}

.logo-emoji {
  font-size: 64rpx;
}

.app-name {
  margin-top: 28rpx;
  font-size: 52rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 4rpx;
}

.app-slogan {
  margin-top: 16rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.82);
  letter-spacing: 2rpx;
}

/* ============ 登录卡片 ============ */
.card {
  position: relative;
  z-index: 2;
  margin: 96rpx 40rpx 0;
  background: #ffffff;
  border-radius: 36rpx;
  padding: 48rpx 40rpx 40rpx;
  box-shadow: 0 24rpx 80rpx rgba(47, 79, 216, 0.14);
  animation: cardIn 0.45s ease-out both;
}

@keyframes cardIn {
  from {
    opacity: 0;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 当前已登录 */
.logged-in {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f0f6ff;
  border: 2rpx solid #dbe8ff;
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 32rpx;
}

.logged-in-info {
  display: flex;
  align-items: center;
}

.logged-in-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #3457d5, #5b7cff);
  color: #ffffff;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logged-in-text {
  display: flex;
  flex-direction: column;
  margin-left: 18rpx;
}

.logged-in-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2d52;
}

.logged-in-tip {
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #8b95b2;
}

.go-home {
  font-size: 26rpx;
  color: #3457d5;
  font-weight: 500;
}

.card-head {
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2d52;
}

.card-desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: #8b95b2;
}

/* ============ 输入框 ============ */
.field {
  display: flex;
  align-items: center;
  height: 100rpx;
  margin-top: 28rpx;
  padding: 0 24rpx;
  background: #f5f7ff;
  border: 2rpx solid #e8ecfa;
  border-radius: 22rpx;
  transition: all 0.2s ease;
}

.field-focus {
  background: #ffffff;
  border-color: #6b8cff;
  box-shadow: 0 8rpx 24rpx rgba(107, 140, 255, 0.18);
}

.field-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  flex-shrink: 0;
}

.input {
  flex: 1;
  height: 100rpx;
  line-height: 100rpx;
  margin-left: 20rpx;
  font-size: 30rpx;
  color: #1f2d52;
}

.input::placeholder,
.ph {
  color: #b6bfd8;
}

.eye {
  padding: 10rpx;
  font-size: 30rpx;
  color: #8b95b2;
}

/* ============ 记住账号 / 忘记密码 ============ */
.row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 28rpx;
}

.remember {
  display: flex;
  align-items: center;
}

.check {
  width: 34rpx;
  height: 34rpx;
  border-radius: 10rpx;
  border: 2rpx solid #c3cbe4;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.check-on {
  background: #3457d5;
  border-color: #3457d5;
}

.check-mark {
  color: #ffffff;
  font-size: 22rpx;
  line-height: 1;
}

.remember-text {
  margin-left: 12rpx;
  font-size: 26rpx;
  color: #6b7595;
}

.forgot {
  font-size: 26rpx;
  color: #3457d5;
}

/* ============ 按钮 ============ */
.btn-login {
  margin-top: 44rpx;
  height: 100rpx;
  line-height: 100rpx;
  background: linear-gradient(135deg, #3457d5 0%, #5b7cff 100%);
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  border-radius: 24rpx;
  box-shadow: 0 16rpx 36rpx rgba(52, 87, 213, 0.32);
}

.btn-login::after {
  border: none;
}

.btn-disabled {
  background: #c3d0f5;
  box-shadow: none;
}

.btn-register {
  margin-top: 8rpx;
  height: 96rpx;
  line-height: 96rpx;
  background: #ffffff;
  color: #3457d5;
  font-size: 32rpx;
  font-weight: 500;
  border: 2rpx solid #c9d4f2;
  border-radius: 24rpx;
}

.btn-register::after {
  border: none;
}

/* ============ 常用账号 ============ */
.saved {
  margin-top: 36rpx;
  padding-top: 32rpx;
  border-top: 2rpx solid #f0f3fb;
}

.saved-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.saved-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #1f2d52;
}

.saved-manage {
  font-size: 24rpx;
  color: #3457d5;
}

.saved-list {
  margin-top: 20rpx;
  white-space: nowrap;
  width: 100%;
}

.saved-item {
  display: inline-flex;
  align-items: center;
  position: relative;
  margin-right: 20rpx;
  padding: 16rpx 24rpx 16rpx 16rpx;
  background: #f7f9ff;
  border: 2rpx solid #e8ecfa;
  border-radius: 20rpx;
  transition: all 0.2s ease;
}

.saved-current {
  background: #eef3ff;
  border-color: #b9c9f7;
}

.saved-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6b8cff, #3457d5);
  color: #ffffff;
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.saved-info {
  display: flex;
  flex-direction: column;
  margin-left: 14rpx;
  margin-right: 12rpx;
  max-width: 240rpx;
}

.saved-name {
  font-size: 26rpx;
  color: #1f2d52;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
}

.saved-user {
  margin-top: 2rpx;
  font-size: 22rpx;
  color: #9aa6c8;
  overflow: hidden;
  text-overflow: ellipsis;
}

.saved-badge {
  align-self: flex-start;
  font-size: 20rpx;
  color: #3457d5;
  background: #e3ecff;
  border-radius: 999rpx;
  padding: 2rpx 12rpx;
  margin-left: 6rpx;
}

.saved-del {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #ffe3e3;
  color: #e25c5c;
  font-size: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 6rpx;
}

.saved-tip {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  color: #b6bfd8;
}

/* ============ 分割线 / 游客入口 ============ */
.divider {
  display: flex;
  align-items: center;
  margin: 44rpx 0 24rpx;
}

.line {
  flex: 1;
  height: 2rpx;
  background: #edf0f9;
}

.divider-text {
  margin: 0 20rpx;
  font-size: 24rpx;
  color: #a5adc4;
}

.guest-row {
  display: flex;
  justify-content: center;
  margin-top: 20rpx;
}

.guest {
  font-size: 26rpx;
  color: #8b95b2;
}

.footer {
  margin-top: 48rpx;
  text-align: center;
  font-size: 22rpx;
  color: #b6bfd8;
}
</style>
