<template>
  <view class="detail-page">
    <!-- 商品图片：完整显示（不裁剪），支持多图 + 点击大图预览 -->
    <view class="gallery">
      <image
        v-for="(img, index) in galleryImages"
        :key="index"
        class="goods-img"
        :src="img"
        mode="widthFix"
        @click="previewImage(index)"
      ></image>
      <view v-if="galleryImages.length === 0" class="no-img">暂无图片</view>
    </view>

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
  computed: {
    // 优先展示多图列表；没有时回退到封面图
    galleryImages() {
      const imgs = this.detail && this.detail.images;
      if (Array.isArray(imgs) && imgs.length > 0) return imgs;
      return this.detail && this.detail.image ? [this.detail.image] : [];
    }
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
    // 点击图片全屏预览
    previewImage(index) {
      if (!this.galleryImages.length) return;
      uni.previewImage({
        urls: this.galleryImages,
        current: this.galleryImages[index]
      });
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
  box-sizing: border-box;
}
.gallery {
  background: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
}
.goods-img {
  width: 100%;
  display: block;
  background: #eee;
}
.no-img {
  padding: 80rpx 0;
  text-align: center;
  color: #999;
  font-size: 26rpx;
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
