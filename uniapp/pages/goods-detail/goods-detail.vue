<template>
  <view class="detail-page">
    <image class="goods-img" :src="detail.image" mode="aspectFill"></image>
    <view class="info">
      <view class="price">¥{{ detail.price }}</view>
      <view class="title">{{ detail.title }}</view>
      <view class="desc">{{ detail.description }}</view>
      <view class="publisher">发布人：{{ detail.nickname || '未知用户' }}</view>
    </view>

    <view class="collect-btn" @click="toggleCollect">
      {{ detail.isCollect ? '已收藏' : '收藏' }}
    </view>
  </view>
</template>
<script>
export default {
  data() {
    return {
      goodsId: null,
      detail: {}
    }
  },
  onLoad(options) {
    this.goodsId = options.id
    this.getDetail()
  },
  methods: {
    // 获取商品详情
    getDetail() {
      uni.request({
        url: `http://localhost:3000/api/goods/${this.goodsId}`,
        header: {
          Authorization: uni.getStorageSync('token')
            ? `Bearer ${uni.getStorageSync('token')}`
            : ''
        },
        success: (res) => {
          if (res.data.code === 200) {
            this.detail = res.data.data
          } else {
            uni.showToast({ title: res.data.msg || res.data.message || '获取商品详情失败', icon: 'none' })
          }
        },
        fail() {
          uni.showToast({ title: "网络异常", icon: "none" })
        }
      })
    },
    // 切换收藏/取消收藏
    toggleCollect() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({ title: "请先登录", icon: "none" })
        return
      }
      if (this.detail.isCollect) {
        // 取消收藏
        uni.request({
          url: `http://localhost:3000/api/collect/${this.goodsId}`,
          method: "DELETE",
          header: { Authorization: `Bearer ${token}` },
          success: (res) => {
            if (res.data.code === 200) {
              this.detail.isCollect = false
              uni.showToast({ title: "已取消收藏" })
            } else {
              uni.showToast({ title: res.data.msg || res.data.message || '操作失败', icon: "none" })
            }
          }
        })
      } else {
        // 添加收藏
        uni.request({
          url: "http://localhost:3000/api/collect",
          method: "POST",
          header: { Authorization: `Bearer ${token}` },
          data: { goodsId: this.goodsId },
          success: (res) => {
            if (res.data.code === 200) {
              this.detail.isCollect = true
              uni.showToast({ title: "收藏成功" })
            } else {
              uni.showToast({ title: res.data.msg || res.data.message || '操作失败', icon: "none" })
            }
          }
        })
      }
    }
  }
}
</script>
<style scoped>
.detail-page {
  padding: 20rpx;
  background-color: #f5f6f8;
  min-height: 100vh;
}
.goods-img {
  width: 100%;
  height: 500rpx;
  border-radius: 12rpx;
}
.price {
  font-size: 40rpx;
  color: #ff4d4f;
  font-weight: bold;
  margin: 20rpx 0;
}
.title {
  font-size: 32rpx;
  color: #222;
}
.desc {
  margin: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}
.publisher {
  font-size: 26rpx;
  color: #888;
}
.collect-btn {
  margin-top: 40rpx;
  background: #2b85e4;
  color: #fff;
  text-align: center;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size:30rpx;
}
</style>