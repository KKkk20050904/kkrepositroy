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

    <!-- 仅发布者本人可见：删除商品 -->
    <button v-if="canDelete" class="delete-btn" @click="deleteGoods">🗑 删除这件商品</button>
  </view>
</template>

<script>
import { request } from '../../common/request.js';
import { getCurrentUser } from '../../common/accounts.js';

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
    },
    // 当前登录用户是否为该商品的发布者（是则可删除）
    canDelete() {
      const user = getCurrentUser();
      if (!user || !this.detail) return false;
      return Number(user.id) === Number(this.detail.user_id);
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
    // 删除商品（仅发布者本人；二次确认后调用后端）
    deleteGoods() {
      uni.showModal({
        title: '删除商品',
        content: '确定删除这件商品吗？删除后不可恢复。',
        confirmText: '删除',
        confirmColor: '#e64340',
        success: (r) => {
          if (!r.confirm) return;
          uni.showLoading({ title: '删除中', mask: true });
          request({ url: `/api/goods/${this.goodsId}`, method: 'DELETE' })
            .then(() => {
              uni.hideLoading();
              uni.showToast({ title: '已删除', icon: 'success' });
              setTimeout(() => {
                // 返回列表页并刷新（reLaunch 保证列表拿到最新数据）
                uni.reLaunch({ url: '/pages/goods/list' });
              }, 700);
            })
            .catch((e) => {
              uni.hideLoading();
              uni.showToast({ title: (e && e.message) || '删除失败', icon: 'none' });
            });
        }
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
.delete-btn {
  margin-top: 24rpx;
  background: #fff;
  color: #e64340;
  border: 2rpx solid #f3c0be;
  text-align: center;
  padding: 20rpx;
  border-radius: 12rpx;
  font-size: 30rpx;
}
.delete-btn::after {
  border: none;
}
</style>
