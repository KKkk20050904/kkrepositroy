<template>
  <view v-if="show" class="lp-mask" @click="close">
    <view class="lp-sheet" @click.stop>
      <view class="lp-head">
        <view class="lp-tabs">
          <text class="lp-tab" :class="{ 'lp-tab-active': mode === 'login' }" @click="mode = 'login'">登录</text>
          <text class="lp-tab" :class="{ 'lp-tab-active': mode === 'register' }" @click="mode = 'register'">注册</text>
        </view>
        <text class="lp-close" @click="close">✕</text>
      </view>

      <scroll-view scroll-y class="lp-body">
        <!-- ==================== 登录 ==================== -->
        <block v-if="mode === 'login'">
          <view class="lp-welcome">
            <text class="lp-title">欢迎回来 👋</text>
            <text class="lp-sub">登录后即可发布、收藏和私信沟通</text>
          </view>

          <!-- 常用账号（多账户切换器） -->
          <view v-if="accounts.length" class="lp-saved">
            <view class="lp-saved-head">
              <text class="lp-saved-title">常用账号（{{ accounts.length }}）</text>
              <view class="lp-saved-actions">
                <text v-if="managing" class="lp-saved-action" @click="onClearAll">清空</text>
                <text class="lp-saved-action" @click="managing = !managing">{{ managing ? '完成' : '管理' }}</text>
              </view>
            </view>
            <scroll-view scroll-x class="lp-saved-list">
              <view
                v-for="acc in accounts"
                :key="acc.username"
                class="lp-acc"
                :class="{ 'lp-acc-cur': acc.username === currentUsername }"
                @click="onSavedTap(acc)"
              >
                <view class="lp-acc-avatar">{{ initial(acc) }}</view>
                <view class="lp-acc-info">
                  <text class="lp-acc-name">{{ acc.nickname || acc.username }}</text>
                  <text class="lp-acc-user">@{{ acc.username }}</text>
                </view>
                <text v-if="!managing && acc.username === currentUsername" class="lp-acc-badge">当前</text>
                <view v-if="managing" class="lp-acc-del" @click.stop="onRemoveAccount(acc)">✕</view>
              </view>
              <!-- 切换 / 添加新账号 -->
              <view class="lp-acc lp-acc-add" @click="startNewAccount">
                <text class="lp-acc-add-icon">＋</text>
                <text class="lp-acc-add-text">切换 / 添加账号</text>
              </view>
            </scroll-view>
            <view v-if="currentUsername" class="lp-logout-row">
              <text class="lp-muted">当前登录：{{ currentNickname || currentUsername }}</text>
              <text class="lp-link" @click="logoutCurrent">退出登录</text>
            </view>
            <text v-else class="lp-saved-tip">点账号卡片即可免密切换；登录新账号后会自动保存</text>
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'login-user' }">
            <text class="lp-icon">👤</text>
            <input
              class="lp-input"
              v-model="loginForm.username"
              placeholder="用户名 / 学号"
              placeholder-class="lp-ph"
              @focus="focusField = 'login-user'"
              @blur="focusField = ''"
              @confirm="submitLogin"
              :confirm-type="'done'"
            />
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'login-pwd' }">
            <text class="lp-icon">🔒</text>
            <input
              class="lp-input"
              v-model="loginForm.password"
              :password="!showPwd"
              placeholder="登录密码"
              placeholder-class="lp-ph"
              @focus="focusField = 'login-pwd'"
              @blur="focusField = ''"
              @confirm="submitLogin"
              :confirm-type="'done'"
            />
            <text class="lp-eye" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁' }}</text>
          </view>

          <button class="lp-btn" :loading="loading" :disabled="!canLogin || loading" @click="submitLogin">
            {{ loading ? '登录中…' : '登 录' }}
          </button>

          <view class="lp-switch">
            <text class="lp-muted">还没有账号？</text>
            <text class="lp-link" @click="mode = 'register'">立即注册</text>
          </view>
        </block>

        <!-- ==================== 注册 ==================== -->
        <block v-else>
          <view class="lp-welcome">
            <text class="lp-title">创建账号 ✨</text>
            <text class="lp-sub">加入校园闲置交易，让旧物遇见新主人</text>
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'reg-user' }">
            <text class="lp-icon">👤</text>
            <input
              class="lp-input"
              v-model="registerForm.username"
              placeholder="用户名（3-30位字母、数字或下划线）"
              placeholder-class="lp-ph"
              @focus="focusField = 'reg-user'"
              @blur="focusField = ''"
              @confirm="submitRegister"
              :confirm-type="'done'"
            />
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'reg-nick' }">
            <text class="lp-icon">😊</text>
            <input
              class="lp-input"
              v-model="registerForm.nickname"
              maxlength="30"
              placeholder="昵称（选填）"
              placeholder-class="lp-ph"
              @focus="focusField = 'reg-nick'"
              @blur="focusField = ''"
              @confirm="submitRegister"
              :confirm-type="'done'"
            />
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'reg-pwd' }">
            <text class="lp-icon">🔒</text>
            <input
              class="lp-input"
              v-model="registerForm.password"
              :password="!showPwd"
              placeholder="设置密码（至少 6 位）"
              placeholder-class="lp-ph"
              @focus="focusField = 'reg-pwd'"
              @blur="focusField = ''"
              @confirm="submitRegister"
              :confirm-type="'done'"
            />
            <text class="lp-eye" @click="showPwd = !showPwd">{{ showPwd ? '🙈' : '👁' }}</text>
          </view>

          <!-- 密码强度 -->
          <view v-if="registerForm.password" class="lp-strength">
            <view class="lp-bars">
              <view class="lp-bar" :class="strengthClass(1)"></view>
              <view class="lp-bar" :class="strengthClass(2)"></view>
              <view class="lp-bar" :class="strengthClass(3)"></view>
            </view>
            <text class="lp-strength-text" :class="'lp-st' + strength.level">{{ strength.text }}</text>
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'reg-confirm' }">
            <text class="lp-icon">✅</text>
            <input
              class="lp-input"
              v-model="registerForm.confirmPassword"
              :password="!showPwd"
              placeholder="再次输入密码"
              placeholder-class="lp-ph"
              @focus="focusField = 'reg-confirm'"
              @blur="focusField = ''"
              @confirm="submitRegister"
              :confirm-type="'done'"
            />
            <text v-if="registerForm.confirmPassword && confirmMatch" class="lp-ok">✓</text>
            <text v-else-if="registerForm.confirmPassword && !confirmMatch" class="lp-bad">✕</text>
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'reg-phone' }">
            <text class="lp-icon">📱</text>
            <input
              class="lp-input"
              v-model="registerForm.phone"
              type="number"
              maxlength="11"
              placeholder="手机号（选填，11 位）"
              placeholder-class="lp-ph"
              @focus="focusField = 'reg-phone'"
              @blur="focusField = ''"
              @confirm="submitRegister"
              :confirm-type="'done'"
            />
          </view>

          <view class="lp-field" :class="{ 'lp-field-on': focusField === 'reg-email' }">
            <text class="lp-icon">✉️</text>
            <input
              class="lp-input"
              v-model="registerForm.email"
              placeholder="邮箱（选填）"
              placeholder-class="lp-ph"
              @focus="focusField = 'reg-email'"
              @blur="focusField = ''"
              @confirm="submitRegister"
              :confirm-type="'done'"
            />
          </view>

          <view class="lp-agree" @click="agree = !agree">
            <view class="lp-check" :class="{ 'lp-check-on': agree }">
              <text v-if="agree" class="lp-check-mark">✓</text>
            </view>
            <view class="lp-agree-text">
              <text>我已阅读并同意</text>
              <text class="lp-link" @click.stop="showAgreement">《用户协议》</text>
            </view>
          </view>

          <button class="lp-btn" :loading="loading" :disabled="!canRegister || loading" @click="submitRegister">
            {{ loading ? '注册中…' : '注 册' }}
          </button>

          <view class="lp-switch">
            <text class="lp-muted">已有账号？</text>
            <text class="lp-link" @click="mode = 'login'">直接登录</text>
          </view>
        </block>
      </scroll-view>
    </view>
  </view>
</template>

<script>
import { login, register } from '../../api/auth.js'
import { setToken, setUser, clearAuth, BASE_URL } from '../../common/request.js'
import {
  listAccounts,
  saveAccount,
  switchTo,
  removeAccount,
  clearAllAccounts,
  getCurrentUsername
} from '../../common/accounts.js'

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/
const PHONE_RE = /^1\d{10}$/
const EMAIL_RE = /^[\w.-]+@[\w-]+(\.[\w-]+)+$/
const REMEMBER_KEY = 'remember_username'

/**
 * 登录 / 注册弹窗组件
 * 用法：<login-popup :show="showLogin" @update:show="showLogin = $event" @success="onAuthSuccess" />
 */
export default {
  name: 'login-popup',
  props: {
    show: { type: Boolean, default: false }
  },
  emits: ['update:show', 'success'],
  data() {
    return {
      mode: 'login',
      loading: false,
      showPwd: false,
      agree: false,
      focusField: '',
      accounts: [],
      currentUsername: '',
      managing: false,
      loginForm: { username: '', password: '' },
      registerForm: {
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
    canLogin() {
      return this.loginForm.username.trim() !== '' && this.loginForm.password !== ''
    },
    canRegister() {
      return this.registerForm.username.trim() !== '' && this.registerForm.password !== ''
    },
    confirmMatch() {
      return this.registerForm.confirmPassword !== '' &&
        this.registerForm.password === this.registerForm.confirmPassword
    },
    currentNickname() {
      const acc = this.accounts.find((a) => a.username === this.currentUsername)
      return acc ? acc.nickname || acc.username : ''
    },
    strength() {
      const p = this.registerForm.password
      if (!p) return { level: 0, text: '' }
      let score = 0
      if (p.length >= 6) score++
      if (p.length >= 10) score++
      if (/[a-zA-Z]/.test(p) && /\d/.test(p)) score++
      if (/[^a-zA-Z0-9]/.test(p)) score++
      const level = Math.min(3, Math.max(1, score - 1))
      const text = level === 1 ? '强度：弱' : level === 2 ? '强度：中' : '强度：强'
      return { level, text }
    }
  },
  watch: {
    show(value) {
      if (value) this.onOpen()
    }
  },
  methods: {
    onOpen() {
      this.mode = 'login'
      this.loading = false
      this.focusField = ''
      this.managing = false
      this.accounts = listAccounts()
      this.currentUsername = getCurrentUsername()
      const saved = uni.getStorageSync(REMEMBER_KEY)
      if (saved && !this.loginForm.username) this.loginForm.username = saved
    },
    initial(obj) {
      const name = (obj && (obj.nickname || obj.username)) || ''
      return name ? name.slice(0, 1).toUpperCase() : '?'
    },
    close() {
      this.$emit('update:show', false)
    },
    strengthClass(index) {
      return this.strength.level >= index ? 'lp-bar-on' + this.strength.level : ''
    },
    showAgreement() {
      uni.showModal({
        title: '用户协议',
        content: '本平台仅面向在校大学生，用于校园闲置物品流转。请如实发布商品信息，文明沟通，线下交易注意安全。平台对交易纠纷不承担责任，请自行核实对方身份与物品情况。',
        showCancel: false,
        confirmText: '我知道了'
      })
    },
    finishSuccess(user, message) {
      this.$emit('success', user)
      this.close()
      uni.showToast({ title: message, icon: 'success' })
    },
    // 登录
    submitLogin() {
      if (this.loading) return
      const { username, password } = this.loginForm
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
          uni.setStorageSync(REMEMBER_KEY, username.trim())
          setToken(data.token)
          setUser(data.user)
          saveAccount(data.token, data.user)
          this.loginForm.password = ''
          this.finishSuccess(data.user, '登录成功')
        })
        .catch(() => {})
        .then(() => {
          this.loading = false
        })
    },
    // 注册（成功后自动登录）
    submitRegister() {
      if (this.loading) return
      const { username, nickname, password, confirmPassword, phone, email } = this.registerForm

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
          saveAccount(data.token, data.user)
          this.registerForm.password = ''
          this.registerForm.confirmPassword = ''
          this.finishSuccess(data.user, '注册成功，已自动登录')
        })
        .catch(() => {})
        .then(() => {
          this.loading = false
        })
    },
    // 常用账号一键登录（校验 token 后写入登录态）
    onSavedTap(acc) {
      if (acc.username === this.currentUsername) {
        uni.showToast({ title: '当前已登录该账号', icon: 'none' })
        return
      }
      uni.showLoading({ title: '登录中', mask: true })
      uni.request({
        url: BASE_URL + '/api/auth/me',
        header: { Authorization: 'Bearer ' + acc.token },
        success: (res) => {
          uni.hideLoading()
          const body = res.data || {}
          if (res.statusCode === 200 && body.code === 0 && body.data && body.data.user) {
            switchTo(acc)
            setUser(body.data.user)
            this.finishSuccess(body.data.user, '已切换账号')
          } else if (body.code === 1004) {
            removeAccount(acc.username)
            this.accounts = listAccounts()
            this.loginForm.username = acc.username
            uni.showToast({ title: '该账号登录已过期，请重新输密码', icon: 'none' })
          } else {
            uni.showToast({ title: body.message || '切换失败', icon: 'none' })
          }
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '网络异常，请检查后端服务', icon: 'none' })
        }
      })
    },
    // 刷新账号列表与当前登录状态
    refreshAccounts() {
      this.accounts = listAccounts()
      this.currentUsername = getCurrentUsername()
    },
    // 管理模式下删除某个已保存账号
    onRemoveAccount(acc) {
      uni.showModal({
        title: '移除账号',
        content: `确定不再保存「${acc.nickname || acc.username}」吗？`,
        success: (r) => {
          if (!r.confirm) return
          const wasCurrent = getCurrentUsername() === acc.username
          removeAccount(acc.username)
          if (wasCurrent) clearAuth()
          this.refreshAccounts()
          uni.showToast({ title: '已移除', icon: 'none' })
        }
      })
    },
    // 清空全部已保存账号（不影响当前登录状态）
    onClearAll() {
      uni.showModal({
        title: '清空常用账号',
        content: '将删除本机保存的所有账号（当前登录状态不受影响）',
        success: (r) => {
          if (!r.confirm) return
          clearAllAccounts()
          this.managing = false
          this.refreshAccounts()
          uni.showToast({ title: '已清空', icon: 'none' })
        }
      })
    },
    // 切换/添加新账号：清空表单，登录成功后自动保存到列表
    startNewAccount() {
      this.loginForm.username = ''
      this.loginForm.password = ''
      this.showPwd = false
      uni.showToast({ title: '请输入要登录的账号', icon: 'none' })
    },
    // 退出当前登录（保留已保存账号，方便切换）
    logoutCurrent() {
      clearAuth()
      this.currentUsername = ''
      uni.showToast({ title: '已退出登录，可切换其他账号', icon: 'none' })
    }
  }
}
</script>

<style>
/* ==================== 弹窗容器 ==================== */
.lp-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(15, 23, 42, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.lp-sheet {
  width: 100%;
  background: #ffffff;
  border-radius: 36rpx 36rpx 0 0;
  padding: 28rpx 40rpx 40rpx;
  box-sizing: border-box;
  animation: lpSheetIn 0.3s ease-out both;
}

@keyframes lpSheetIn {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.lp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16rpx;
}

.lp-tabs {
  display: flex;
  align-items: flex-end;
}

.lp-tab {
  font-size: 34rpx;
  color: #9aa6c8;
  margin-right: 36rpx;
  padding-bottom: 8rpx;
  border-bottom: 4rpx solid transparent;
  transition: all 0.2s ease;
}

.lp-tab-active {
  font-size: 38rpx;
  font-weight: 700;
  color: #1f2d52;
  border-bottom-color: #3457d5;
}

.lp-close {
  font-size: 30rpx;
  color: #9aa6c8;
  padding: 8rpx;
}

.lp-body {
  max-height: 76vh;
}

/* ==================== 欢迎语 ==================== */
.lp-welcome {
  display: flex;
  flex-direction: column;
  margin: 12rpx 0 8rpx;
}

.lp-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1f2d52;
}

.lp-sub {
  margin-top: 10rpx;
  font-size: 26rpx;
  color: #8b95b2;
}

/* ==================== 常用账号 ==================== */
.lp-saved {
  margin-top: 24rpx;
}

.lp-saved-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp-saved-title {
  font-size: 24rpx;
  color: #8b95b2;
}

.lp-saved-actions {
  display: flex;
  align-items: center;
}

.lp-saved-action {
  font-size: 24rpx;
  color: #3457d5;
  margin-left: 20rpx;
}

.lp-saved-list {
  margin-top: 16rpx;
  white-space: nowrap;
  width: 100%;
}

.lp-acc {
  display: inline-flex;
  align-items: center;
  margin-right: 16rpx;
  padding: 12rpx 20rpx 12rpx 12rpx;
  background: #f7f9ff;
  border: 2rpx solid #e8ecfa;
  border-radius: 18rpx;
}

.lp-acc-cur {
  background: #eef3ff;
  border-color: #b9c9f7;
}

.lp-acc-avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #6b8cff, #3457d5);
  color: #ffffff;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lp-acc-info {
  display: flex;
  flex-direction: column;
  margin-left: 12rpx;
  max-width: 220rpx;
}

.lp-acc-name {
  font-size: 26rpx;
  color: #1f2d52;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lp-acc-user {
  margin-top: 2rpx;
  font-size: 20rpx;
  color: #9aa6c8;
  overflow: hidden;
  text-overflow: ellipsis;
}

.lp-acc-badge {
  margin-left: 8rpx;
  font-size: 20rpx;
  color: #3457d5;
  background: #e3ecff;
  border-radius: 999rpx;
  padding: 2rpx 10rpx;
}

.lp-acc-del {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #ffe3e3;
  color: #e25c5c;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10rpx;
}

.lp-acc-add {
  border-style: dashed;
  background: #ffffff;
}

.lp-acc-add-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #eef2ff;
  color: #3457d5;
  font-size: 30rpx;
}

.lp-acc-add-text {
  margin-left: 10rpx;
  font-size: 24rpx;
  color: #3457d5;
}

.lp-logout-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  font-size: 24rpx;
}

.lp-saved-tip {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: #b6bfd8;
}

/* ==================== 输入框 ==================== */
.lp-field {
  display: flex;
  align-items: center;
  height: 96rpx;
  margin-top: 22rpx;
  padding: 0 24rpx;
  background: #f5f7ff;
  border: 2rpx solid #e8ecfa;
  border-radius: 20rpx;
  transition: all 0.2s ease;
}

.lp-field-on {
  background: #ffffff;
  border-color: #6b8cff;
  box-shadow: 0 8rpx 24rpx rgba(107, 140, 255, 0.18);
}

.lp-icon {
  font-size: 30rpx;
}

.lp-input {
  flex: 1;
  height: 96rpx;
  line-height: 96rpx;
  margin-left: 16rpx;
  font-size: 30rpx;
  color: #1f2d52;
}

.lp-ph {
  color: #b6bfd8;
}

.lp-eye {
  padding: 10rpx;
  font-size: 30rpx;
  color: #8b95b2;
}

.lp-ok {
  color: #22b573;
  font-size: 30rpx;
  font-weight: 700;
}

.lp-bad {
  color: #ff5a5a;
  font-size: 28rpx;
  font-weight: 700;
}

/* ==================== 密码强度 ==================== */
.lp-strength {
  display: flex;
  align-items: center;
  margin-top: 14rpx;
}

.lp-bars {
  flex: 1;
  display: flex;
}

.lp-bar {
  flex: 1;
  height: 10rpx;
  margin-right: 8rpx;
  border-radius: 999rpx;
  background: #e8ecfa;
}

.lp-bar-on1 {
  background: #ff9f43;
}

.lp-bar-on2 {
  background: #fbc531;
}

.lp-bar-on3 {
  background: #22b573;
}

.lp-strength-text {
  margin-left: 14rpx;
  font-size: 22rpx;
}

.lp-st1 {
  color: #e58e26;
}

.lp-st2 {
  color: #d4a017;
}

.lp-st3 {
  color: #1e9e63;
}

/* ==================== 协议 ==================== */
.lp-agree {
  display: flex;
  align-items: flex-start;
  margin-top: 28rpx;
}

.lp-check {
  width: 34rpx;
  height: 34rpx;
  margin-top: 4rpx;
  border-radius: 10rpx;
  border: 2rpx solid #c3cbe4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.lp-check-on {
  background: #3457d5;
  border-color: #3457d5;
}

.lp-check-mark {
  color: #ffffff;
  font-size: 20rpx;
  line-height: 1;
}

.lp-agree-text {
  margin-left: 12rpx;
  font-size: 24rpx;
  color: #6b7595;
}

/* ==================== 按钮 ==================== */
.lp-btn {
  margin-top: 36rpx;
  height: 96rpx;
  line-height: 96rpx;
  background: linear-gradient(135deg, #3457d5 0%, #5b7cff 100%);
  color: #ffffff;
  font-size: 33rpx;
  font-weight: 600;
  letter-spacing: 4rpx;
  border-radius: 22rpx;
  box-shadow: 0 14rpx 30rpx rgba(52, 87, 213, 0.3);
}

.lp-btn::after {
  border: none;
}

.lp-btn[disabled] {
  background: #c3d0f5;
  box-shadow: none;
}

/* ==================== 切换 / 提示 ==================== */
.lp-switch {
  display: flex;
  justify-content: center;
  margin: 28rpx 0 12rpx;
  font-size: 26rpx;
}

.lp-muted {
  color: #8b95b2;
}

.lp-link {
  color: #3457d5;
  margin-left: 6rpx;
}
</style>
