<template>
  <view class="container">
    <view class="header">
      <text class="title">校园闲置交易</text>
      <text class="subtitle">登录后开启校内好物流转</text>
    </view>

    <view class="form">
      <input
        class="input"
        v-model="form.username"
        placeholder="用户名"
        placeholder-class="ph"
      />
      <input
        class="input"
        v-model="form.password"
        password
        placeholder="密码"
        placeholder-class="ph"
      />
      <button class="btn-primary" :loading="loading" @click="handleLogin">登 录</button>

      <view class="link-row">
        <text class="link" @click="goRegister">还没有账号？去注册</text>
      </view>
    </view>
  </view>
</template>

<script>
import { login } from '../../api/auth.js'
import { setToken, setUser } from '../../common/request.js'

export default {
  data() {
    return {
      loading: false,
      form: {
        username: '',
        password: ''
      }
    }
  },
  methods: {
    goRegister() {
      uni.navigateTo({ url: '/pages/register/register' })
    },
    handleLogin() {
      const { username, password } = this.form
      if (!username || !password) {
        uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
        return
      }
      this.loading = true
      login({ username, password })
        .then((data) => {
          setToken(data.token)
          setUser(data.user)
          uni.showToast({ title: '登录成功', icon: 'success' })
          setTimeout(() => {
            uni.navigateBack({
              fail: () => {
                // 没有上一页（如直接进入登录页）时，停留当前页即可
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
  padding-top: 160rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.title {
  font-size: 56rpx;
  font-weight: 700;
  color: #2b5ab0;
}

.subtitle {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #9aa3b2;
}

.form {
  margin-top: 100rpx;
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
