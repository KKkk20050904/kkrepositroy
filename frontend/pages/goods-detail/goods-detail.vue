<template>
  <view class="detail-page">
    <image class="goods-img" :src="detail.image" mode="aspectFill"></image>
    <view class="info">
      <view class="price">¥{{ detail.price }}</view>
      <view class="title">{{ detail.title }}</view>
      <view class="desc">{{ detail.description || '暂无描述' }}</view>
      <view class="publisher">发布人：{{ detail.nickname || '未知用户' }}</view>
    </view>

    <button class="collect-btn" @click="toggleCollect">
      {{ detail.isCollect ? '已收藏（点击取消）' : '☆☆ 收藏这件商品' }}
    </button>
  </view>
</template>

<script>
import { request } from '../../common/request.js';

export default {
  data() {
    return {
      goodsId: null,
      detail: { isCollect: false }
    };
  },
  onLoad(options) {
    this.goodsId = options.id;
    this.getDetail();
  },
  methods: {
    // 获取商品详情（公开接口；未登录时 isCollect 为 false）
    async getDetail() {
      try {
        const data = await request({ url: `/api/goods/${this.goodsId}`, method: 'GET' });
        this.detail = data;
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '获取商品详情失败', icon: 'none' });
      }
    },
    // 收藏 / 取消收藏（需登录）
    async toggleCollect() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 600);
        return;
      }
      try {
        if (this.detail.isCollect) {
          await request({ url: `/api/collect/${this.goodsId}`, method: 'DELETE' });
          this.detail.isCollect = false;
          uni.showToast({ title: '已取消收藏' });
        } else {
          await request({ url: '/api/collect', method: 'POST', data: { goodsId: Number(this.goodsId) } });
          this.detail.isCollect = true;
          uni.showToast({ title: '收藏成功' });
        }
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '操作失败', icon: 'none' });
      }
    }
  }
};
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
  background: #eee;
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
  font-size: 30rpx;
}
</style>
