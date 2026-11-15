<template>
  <view class="page">
    <!-- 顶部品牌渐变区 -->
    <view class="hero-bg">
      <view class="blob blob-a"></view>
      <view class="blob blob-b"></view>
      <view class="ring ring-a"></view>
    </view>

    <view class="hero">
      <view class="back-chip" @click="goLogin">
        <text class="back-arrow">‹</text>
        <text>登录</text>
      </view>
      <text class="hero-title">创建账号</text>
      <text class="hero-sub">加入校园闲置交易，让旧物遇见新主人</text>
    </view>

    <!-- 注册卡片 -->
    <view class="card">
      <!-- 账号信息 -->
      <view class="section-head">
        <view class="section-icon">🪪</view>
        <text class="section-title">账号信息</text>
      </view>

      <view class="field" :class="{ 'field-focus': focusField === 'username', 'field-error': usernameTouched && !usernameOk }">
        <view class="field-icon">👤</view>
        <input
          class="input"
          v-model="form.username"
          placeholder="用户名（3-30位字母、数字或下划线）"
          placeholder-class="ph"
          @focus="focusField = 'username'"
          @blur="onBlur('username')"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
        <text v-if="form.username && usernameOk" class="ok-mark">✓</text>
      </view>
      <text v-if="usernameTouched && !usernameOk" class="hint-error">用户名需为 3-30 位字母、数字或下划线</text>

      <view class="field" :class="{ 'field-focus': focusField === 'nickname' }">
        <view class="field-icon">😊</view>
        <input
          class="input"
          v-model="form.nickname"
          placeholder="昵称（选填，不填默认同用户名）"
          placeholder-class="ph"
          maxlength="30"
          @focus="focusField = 'nickname'"
          @blur="focusField = ''"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>

      <!-- 安全设置 -->
      <view class="section-head section-gap">
        <view class="section-icon">🔐</view>
        <text class="section-title">安全设置</text>
      </view>

      <view class="field" :class="{ 'field-focus': focusField === 'password' }">
        <view class="field-icon">🔒</view>
        <input
          class="input"
          v-model="form.password"
          :password="!showPwd"
          placeholder="设置密码（至少 6 位）"
          placeholder-class="ph"
          @focus="focusField = 'password'"
          @blur="focusField = ''"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
        <view class="eye" @click="showPwd = !showPwd">
          <text>{{ showPwd ? '🙈' : '👁' }}</text>
        </view>
      </view>

      <!-- 密码强度条 -->
      <view v-if="form.password" class="strength">
        <view class="strength-bars">
          <view class="bar" :class="strengthClass(1)"></view>
          <view class="bar" :class="strengthClass(2)"></view>
          <view class="bar" :class="strengthClass(3)"></view>
        </view>
        <text class="strength-text" :class="'strength-' + strength.level">{{ strength.text }}</text>
      </view>

      <view class="field" :class="{ 'field-focus': focusField === 'confirm' }">
        <view class="field-icon">✅</view>
        <input
          class="input"
          v-model="form.confirmPassword"
          :password="!showPwd"
          placeholder="再次输入密码"
          placeholder-class="ph"
          @focus="focusField = 'confirm'"
          @blur="focusField = ''"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
        <text v-if="form.confirmPassword && confirmMatch" class="ok-mark">✓</text>
        <text v-else-if="form.confirmPassword && !confirmMatch" class="err-mark">✕</text>
      </view>
      <text v-if="form.confirmPassword && !confirmMatch" class="hint-error">两次输入的密码不一致</text>

      <!-- 联系方式 -->
      <view class="section-head section-gap">
        <view class="section-icon">📮</view>
        <text class="section-title">联系方式（选填，方便同学联系你）</text>
      </view>

      <view class="field" :class="{ 'field-focus': focusField === 'phone', 'field-error': phoneTouched && !phoneOk }">
        <view class="field-icon">📱</view>
        <input
          class="input"
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="手机号（11 位）"
          placeholder-class="ph"
          @focus="focusField = 'phone'"
          @blur="onBlur('phone')"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>
      <text v-if="phoneTouched && !phoneOk" class="hint-error">手机号格式不正确（11 位数字）</text>

      <view class="field" :class="{ 'field-focus': focusField === 'email', 'field-error': emailTouched && !emailOk }">
        <view class="field-icon">✉️</view>
        <input
          class="input"
          v-model="form.email"
          placeholder="邮箱（选填）"
          placeholder-class="ph"
          @focus="focusField = 'email'"
          @blur="onBlur('email')"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>
      <text v-if="emailTouched && !emailOk" class="hint-error">邮箱格式不正确</text>

      <!-- 用户协议 -->
      <view class="agree-row" @click="agree = !agree">
        <view class="check" :class="{ 'check-on': agree }">
          <text v-if="agree" class="check-mark">✓</text>
        </view>
        <view class="agree-text">
          <text>我已阅读并同意</text>
          <text class="agree-link" @click.stop="showAgreement">《用户协议》</text>
          <text>与</text>
          <text class="agree-link" @click.stop="showAgreement">《隐私政策》</text>
        </view>
      </view>

      <button
        class="btn-register"
        :class="{ 'btn-disabled': !canSubmit }"
        :loading="loading"
        :disabled="!canSubmit || loading"
        @click="handleRegister"
      >
        {{ loading ? '注册中…' : '注 册' }}
      </button>

      <view class="login-link">
        <text class="login-link-text">已有账号？</text>
        <text class="login-link-action" @click="goLogin">直接登录</text>
      </view>
    </view>

    <view class="footer">
      <text>注册即代表你同意校园闲置交易的社区规范</text>
    </view>
  </view>
</template>

<script>
import { register } from '../../api/auth.js'
import { setToken, setUser } from '../../common/request.js'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const PHONE_RE = /^1\d{10}$/
const EMAIL_RE = /^[\w.-]+@[\w-]+(\.[\w-]+)+$/

export default {
  data() {
    return {
      loading: false,
      showPwd: false,
      agree: false,
      focusField: '',
      usernameTouched: false,
      phoneTouched: false,
      emailTouched: false,
      form: {
        username: '',
        nickname: '',
        password: '',
        confirmPassword: '',
        phone: '',
        email: ''
      }
    }
  },
  computed: {
    usernameOk() {
      return USERNAME_RE.test(this.form.username.trim())
    },
    phoneOk() {
      return !this.form.phone.trim() || PHONE_RE.test(this.form.phone.trim())
    },
    emailOk() {
      return !this.form.email.trim() || EMAIL_RE.test(this.form.email.trim())
    },
    confirmMatch() {
      return this.form.confirmPassword !== '' && this.form.password === this.form.confirmPassword
    },
    strength() {
      const p = this.form.password
      if (!p) return { level: 0, text: '' }
      let score = 0
      if (p.length >= 6) score++
      if (p.length >= 10) score++
      if (/[a-zA-Z]/.test(p) && /\d/.test(p)) score++
      if (/[^a-zA-Z0-9]/.test(p)) score++
      const level = Math.min(3, Math.max(1, score - 1))
      const text = level === 1 ? '强度：弱' : level === 2 ? '强度：中' : '强度：强'
      return { level, text }
    },
    canSubmit() {
      return this.form.username.trim() !== '' && this.form.password !== ''
    }
  },
  methods: {
    onBlur(field) {
      this.focusField = ''
      if (field === 'username') this.usernameTouched = true
      if (field === 'phone') this.phoneTouched = true
      if (field === 'email') this.emailTouched = true
    },
    strengthClass(index) {
      return this.strength.level >= index ? 'bar-' + this.strength.level : ''
    },
    goLogin() {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/login/login' })
        }
      })
    },
    showAgreement() {
      uni.showModal({
        title: '用户协议',
        content: '本平台仅面向在校大学生，用于校园闲置物品流转。请如实发布商品信息，文明沟通，线下交易注意安全。平台对交易纠纷不承担责任，请自行核实对方身份与物品情况。',
        showCancel: false,
        confirmText: '我知道了'
      })
    },
    handleRegister() {
      if (this.loading) return
      const { username, nickname, password, confirmPassword, phone, email } = this.form

      this.usernameTouched = true
      if (!USERNAME_RE.test(username.trim())) {
        uni.showToast({ title: '用户名需为 3-30 位字母、数字或下划线', icon: 'none' })
        return
      }
      if (nickname.trim() && nickname.trim().length > 30) {
        uni.showToast({ title: '昵称不能超过 30 个字符', icon: 'none' })
        return
      }
      if (password.length < 6) {
        uni.showToast({ title: '密码至少 6 位', icon: 'none' })
        return
      }
      if (password !== confirmPassword) {
        uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
        return
      }
      if (phone.trim() && !PHONE_RE.test(phone.trim())) {
        uni.showToast({ title: '手机号格式不正确（11位）', icon: 'none' })
        return
      }
      if (email.trim() && !EMAIL_RE.test(email.trim())) {
        uni.showToast({ title: '邮箱格式不正确', icon: 'none' })
        return
      }
      if (!this.agree) {
        uni.showToast({ title: '请先阅读并同意用户协议', icon: 'none' })
        return
      }

      this.loading = true
      register({
        username: username.trim(),
        password,
        nickname: nickname.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined
      })
        .then((data) => {
          setToken(data.token)
          setUser(data.user)
          uni.showToast({ title: '注册成功，已自动登录', icon: 'success' })
          setTimeout(() => {
            uni.reLaunch({ url: '/pages/index/index' })
          }, 900)
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
  height: 480rpx;
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
  width: 300rpx;
  height: 300rpx;
  background: rgba(255, 255, 255, 0.22);
  top: -100rpx;
  right: -70rpx;
  filter: blur(6rpx);
}
.blob-b {
  width: 200rpx;
  height: 200rpx;
  background: rgba(122, 162, 255, 0.6);
  top: 200rpx;
  left: -80rpx;
  filter: blur(10rpx);
}

.ring {
  position: absolute;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.18);
}
.ring-a {
  width: 420rpx;
  height: 420rpx;
  top: -160rpx;
  left: -120rpx;
}

.hero {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  padding: 40rpx 40rpx 0;
}

.back-chip {
  align-self: flex-start;
  display: flex;
  align-items: center;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.16);
  border: 2rpx solid rgba(255, 255, 255, 0.28);
  color: #ffffff;
  font-size: 26rpx;
}

.back-arrow {
  font-size: 36rpx;
  margin-right: 6rpx;
  line-height: 1;
}

.hero-title {
  margin-top: 40rpx;
  font-size: 52rpx;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 4rpx;
}

.hero-sub {
  margin-top: 14rpx;
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.82);
}

/* ============ 注册卡片 ============ */
.card {
  position: relative;
  z-index: 2;
  margin: 56rpx 40rpx 0;
  background: #ffffff;
  border-radius: 36rpx;
  padding: 44rpx 40rpx 36rpx;
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

/* ============ 分节标题 ============ */
.section-head {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
}

.section-gap {
  margin-top: 44rpx;
}

.section-icon {
  width: 44rpx;
  height: 44rpx;
  border-radius: 12rpx;
  background: #eef2ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
}

.section-title {
  margin-left: 14rpx;
  font-size: 28rpx;
  font-weight: 600;
  color: #1f2d52;
}

/* ============ 输入框 ============ */
.field {
  display: flex;
  align-items: center;
  height: 100rpx;
  margin-top: 22rpx;
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

.field-error {
  border-color: #ff8a8a;
  background: #fff7f7;
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

.ok-mark {
  color: #22b573;
  font-size: 30rpx;
  font-weight: 700;
}

.err-mark {
  color: #ff5a5a;
  font-size: 28rpx;
  font-weight: 700;
}

.hint-error {
  display: block;
  margin: 10rpx 4rpx 0;
  font-size: 24rpx;
  color: #ff5a5a;
}

/* ============ 密码强度 ============ */
.strength {
  display: flex;
  align-items: center;
  margin: 14rpx 4rpx 0;
}

.strength-bars {
  display: flex;
  flex: 1;
}

.bar {
  flex: 1;
  height: 10rpx;
  margin-right: 10rpx;
  border-radius: 999rpx;
  background: #e8ecfa;
  transition: background 0.2s ease;
}

.bar-1 {
  background: #ff9f43;
}

.bar-2 {
  background: #fbc531;
}

.bar-3 {
  background: #22b573;
}

.strength-text {
  margin-left: 16rpx;
  font-size: 22rpx;
}

.strength-1 {
  color: #e58e26;
}
.strength-2 {
  color: #d4a017;
}
.strength-3 {
  color: #1e9e63;
}

/* ============ 用户协议 ============ */
.agree-row {
  display: flex;
  align-items: flex-start;
  margin-top: 36rpx;
}

.check {
  width: 34rpx;
  height: 34rpx;
  margin-top: 4rpx;
  border-radius: 10rpx;
  border: 2rpx solid #c3cbe4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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

.agree-text {
  margin-left: 14rpx;
  font-size: 24rpx;
  color: #6b7595;
  line-height: 1.6;
}

.agree-link {
  color: #3457d5;
}

/* ============ 按钮 ============ */
.btn-register {
  margin-top: 40rpx;
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

.btn-register::after {
  border: none;
}

.btn-disabled {
  background: #c3d0f5;
  box-shadow: none;
}

.login-link {
  display: flex;
  justify-content: center;
  margin-top: 28rpx;
}

.login-link-text {
  font-size: 26rpx;
  color: #8b95b2;
}

.login-link-action {
  font-size: 26rpx;
  color: #3457d5;
  margin-left: 8rpx;
}

.footer {
  margin-top: 44rpx;
  text-align: center;
  font-size: 22rpx;
  color: #b6bfd8;
}
</style>
