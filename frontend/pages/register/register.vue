<template>
  <view class="container">
    <view class="header">
      <text class="title">注册账号</text>
      <text class="subtitle">填写以下信息，即刻加入校园闲置交易</text>
    </view>

    <view class="form">
      <input
        class="input"
        v-model="form.username"
        placeholder="用户名（登录账号，必填）"
        placeholder-class="ph"
      />
      <input
        class="input"
        v-model="form.nickname"
        placeholder="昵称（选填）"
        placeholder-class="ph"
      />
      <input
        class="input"
        v-model="form.password"
        password
        placeholder="密码（至少 6 位）"
        placeholder-class="ph"
      />
      <input
        class="input"
        v-model="form.confirmPassword"
        password
        placeholder="确认密码"
        placeholder-class="ph"
      />
      <input
        class="input"
        v-model="form.phone"
        placeholder="手机号（选填）"
        placeholder-class="ph"
      />
      <button class="btn-primary" :loading="loading" @click="handleRegister">注 册</button>

      <view class="link-row">
        <text class="link" @click="goLogin">已有账号？去登录</text>
      </view>
    </view>
  </view>
</template>

<script>
import { register } from '../../api/auth.js'
import { setToken, setUser } from '../../common/request.js'

export default {
  data() {
    return {
      loading: false,
      form: {
        username: '',
        nickname: '',
        password: '',
        confirmPassword: '',
        phone: ''
      }
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
      const { username, nickname, password, confirmPassword, phone } = this.form
      if (!username || !password) {
        uni.showToast({ title: '用户名和密码不能为空', icon: 'none' })
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
      this.loading = true
      register({
        username,
        password,
        nickname: nickname || undefined,
        phone: phone || undefined
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

.input {
  height: 96rpx;
  line-height: 96rpx;
  padding: 0 32rpx;
  margin-bottom: 32rpx;
  background: #f5f7fa;
  border-radius: 16rpx;
  font-size: 30rpx;
  color: #333;
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
