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

      <view class="guest-row">
        <text class="guest" @click="goBrowse">先随便逛逛校园好物 →</text>
      </view>
    </view>

    <view class="footer">
      <text>校园闲置交易 · 账号数据加密保护</text>
    </view>
  </view>
</template>

<script>
import { login } from '../../api/auth.js'
import { setToken, setUser } from '../../common/request.js'

const REMEMBER_KEY = 'remember_username'

export default {
  data() {
    return {
      loading: false,
      showPwd: false,
      remember: true,
      focusField: '',
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
  },
  methods: {
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
