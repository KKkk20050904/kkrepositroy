<template>
  <view class="page">
    <!-- 顶部主视觉 -->
    <view class="hero">
      <view class="hero-title">校园闲置交易</view>
      <view class="hero-sub">让旧物找到新主人 · 让资源不再浪费</view>
      <view class="hero-tag">在校大学生二手流转平台</view>
    </view>

    <!-- 功能说明 -->
    <view class="section">
      <view class="section-title">平台功能</view>
      <view class="feat-list">
        <view class="feat-item">
          <view class="feat-icon icon-publish">发</view>
          <view class="feat-info">
            <view class="feat-name">发布闲置</view>
            <view class="feat-desc">上传图片、填写价格描述，一键发布</view>
          </view>
        </view>
        <view class="feat-item">
          <view class="feat-icon icon-list">逛</view>
          <view class="feat-info">
            <view class="feat-name">浏览搜索</view>
            <view class="feat-desc">按分类浏览、关键词搜索（其他成员模块）</view>
          </view>
        </view>
        <view class="feat-item">
          <view class="feat-icon icon-chat">聊</view>
          <view class="feat-info">
            <view class="feat-name">私信沟通</view>
            <view class="feat-desc">买卖双方站内私信（其他成员模块）</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 后端连接状态 -->
    <view class="status" :class="{ ok: serverOk }">
      <view class="status-dot"></view>
      <text>{{ serverOk ? '后端服务已连接，可以发布商品' : '后端服务未连接（请先运行 一键启动.bat）' }}</text>
    </view>

    <!-- 发布 / 逛逛 入口 -->
    <button class="publish-btn" @click="goPublish">发布闲置商品</button>
    <button class="publish-btn browse-btn" @click="goGoodsList">逛逛校园闲置</button>

    <view class="footer">课程设计小组项目 · 校园闲置物品交易</view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      serverOk: false
    };
  },
  onLoad() {
    this.checkServer();
  },
  methods: {
    // 探测后端是否在线（联调用：/api/health）
    checkServer() {
      uni.request({
        url: 'http://localhost:3000/api/health',
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.code === 0) {
            this.serverOk = true;
          }
        },
        fail: () => {
          this.serverOk = false;
        }
      });
    },
    goPublish() {
      uni.navigateTo({ url: '/pages/publish/publish' });
    },
    goGoodsList() {
      uni.navigateTo({ url: '/pages/goods/list' });
    }
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  padding-bottom: 80rpx;
}

.hero {
  background: linear-gradient(135deg, #2b85ff 0%, #5ea3ff 100%);
  padding: 70rpx 40rpx 60rpx;
  color: #fff;
}

.hero-title {
  font-size: 52rpx;
  font-weight: 700;
}

.hero-sub {
  font-size: 30rpx;
  margin-top: 16rpx;
  opacity: 0.95;
}

.hero-tag {
  display: inline-block;
  margin-top: 24rpx;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.2);
}

.section {
  background: #fff;
  margin: 24rpx;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.feat-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f2f3f5;
}

.feat-item:last-child {
  border-bottom: none;
}

.feat-icon {
  width: 76rpx;
  height: 76rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.icon-publish {
  background: #2b85ff;
}

.icon-list {
  background: #ff9f43;
}

.icon-chat {
  background: #2ecc71;
}

.feat-name {
  font-size: 30rpx;
  font-weight: 500;
}

.feat-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
}

.status {
  display: flex;
  align-items: center;
  margin: 0 24rpx 10rpx;
  padding: 20rpx 24rpx;
  background: #fff;
  border-radius: 12rpx;
  font-size: 24rpx;
  color: #e67e22;
}

.status.ok {
  color: #27ae60;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #e67e22;
  margin-right: 14rpx;
}

.status.ok .status-dot {
  background: #27ae60;
}

.publish-btn {
  margin: 30rpx 24rpx 0;
  background: #2b85ff;
  color: #fff;
  border-radius: 44rpx;
  font-size: 34rpx;
}

.browse-btn {
  margin-top: 20rpx;
  background: #ffffff;
  color: #2b85ff;
  border: 2rpx solid #2b85ff;
}

.footer {
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
  margin-top: 40rpx;
}
</style>
