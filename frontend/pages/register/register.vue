<template>
  <view class="container">
    <view class="header">
      <text class="title">注册账号</text>
      <text class="subtitle">填写以下信息，即刻加入校园闲置交易</text>
    </view>

    <view class="form">
      <view class="input-wrap">
        <input
          class="input"
          v-model="form.username"
          placeholder="用户名（3-30位字母、数字或下划线）"
          placeholder-class="ph"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>

      <view class="input-wrap">
        <input
          class="input"
          v-model="form.nickname"
          placeholder="昵称（选填）"
          placeholder-class="ph"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>

      <view class="input-wrap">
        <input
          class="input"
          v-model="form.password"
          :password="!showPwd"
          placeholder="密码（至少 6 位）"
          placeholder-class="ph"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
        <text class="eye" @click="showPwd = !showPwd">{{ showPwd ? '隐藏' : '显示' }}</text>
      </view>

      <view class="input-wrap">
        <input
          class="input"
          v-model="form.confirmPassword"
          :password="!showPwd"
          placeholder="确认密码"
          placeholder-class="ph"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>

      <view class="input-wrap">
        <input
          class="input"
          v-model="form.phone"
          type="number"
          maxlength="11"
          placeholder="手机号（选填，11位）"
          placeholder-class="ph"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>

      <view class="input-wrap">
        <input
          class="input"
          v-model="form.email"
          placeholder="邮箱（选填）"
          placeholder-class="ph"
          @confirm="handleRegister"
          :confirm-type="'done'"
        />
      </view>

      <button
        class="btn-primary"
        :class="{ 'btn-disabled': !canSubmit }"
        :loading="loading"
        :disabled="!canSubmit || loading"
        @click="handleRegister"
      >注 册</button>

      <view class="link-row">
        <text class="link" @click="goLogin">已有账号？去登录</text>
      </view>
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
    canSubmit() {
      return this.form.username.trim() !== '' && this.form.password !== ''
    }
  },
  methods: {
    goLogin() {
      uni.navigateBack({
        fail: () => {
          uni.reLaunch({ url: '/pages/login/login' })
        }
      })
    },
    handleRegister() {
      if (this.loading) return
      const { username, nickname, password, confirmPassword, phone, email } = this.form

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
          uni.showToast({ title: '注册成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack({
              fail: () => {
                uni.reLaunch({ url: '/pages/login/login' })
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
.container {
  min-height: 100vh;
  padding: 0 48rpx;
  background: linear-gradient(180deg, #f4f8ff 0%, #ffffff 40%);
  box-sizing: border-box;
}

.header {
  padding-top: 120rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 52rpx;
  font-weight: 700;
  color: #2b5ab0;
}

.subtitle {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #9aa3b2;
}

.form {
  margin-top: 80rpx;
}

.input-wrap {
  position: relative;
  height: 96rpx;
  margin-bottom: 32rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
}

.input {
  height: 96rpx;
  line-height: 96rpx;
  padding: 0 32rpx;
  font-size: 30rpx;
  color: #333;
  width: 100%;
  box-sizing: border-box;
}

.eye {
  position: absolute;
  right: 24rpx;
  top: 0;
  height: 96rpx;
  line-height: 96rpx;
  font-size: 26rpx;
  color: #7a8699;
}

.ph {
  color: #b8c0cc;
}

.btn-primary {
  margin-top: 16rpx;
  height: 96rpx;
  line-height: 96rpx;
  background: #2b5ab0;
  color: #fff;
  font-size: 34rpx;
  border-radius: 16rpx;
}

.btn-primary::after {
  border: none;
}

.btn-disabled {
  background: #a9bde0;
}

.link-row {
  margin-top: 40rpx;
  display: flex;
  justify-content: center;
}

.link {
  font-size: 28rpx;
  color: #2b5ab0;
}
</style>
