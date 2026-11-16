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
    </view>

    <view class="seller-card" :class="{ clickable: detail.user_id && !isOwner }" @click="openSeller">
      <image v-if="detail.avatar" class="seller-avatar" :src="detail.avatar" mode="aspectFill"></image>
      <view v-else class="seller-avatar seller-avatar-placeholder">{{ (detail.nickname || '卖').slice(0, 1) }}</view>
      <view class="seller-info">
        <view class="seller-name-row">
          <text class="seller-name">{{ detail.nickname || '校园卖家' }}</text>
          <text v-if="isOwner" class="owner-badge">我发布的</text>
        </view>
        <text class="seller-caption">{{ sellerCaption }}</text>
      </view>
      <text v-if="detail.user_id && !isOwner" class="seller-arrow">›</text>
    </view>

    <view class="bottom-actions">
      <button class="collect-btn" @click="toggleCollect">
        {{ detail.isCollect ? '已收藏（点击取消）' : '☆☆ 收藏这件商品' }}
      </button>
      <button v-if="detail.user_id && !isOwner" class="chat-btn" @click="goChat">💬 联系卖家</button>
    </view>

    <!-- 买家：确认购买（线下交易意向，卖家确认后线下见面付款） -->
    <view v-if="detail.user_id && !isOwner" class="purchase-row">
      <button
        class="purchase-btn"
        :disabled="purchaseState === 'pending' || purchaseState === 'accepted'"
        @click="createPurchaseRequest"
      >
        {{ purchaseButtonText }}
      </button>
      <text v-if="purchaseState === 'pending'" class="purchase-tip">已向卖家发起购买申请，等待确认</text>
      <text v-else-if="purchaseState === 'accepted'" class="purchase-tip ok">卖家已同意，请与卖家约好时间地点线下验货付款</text>
      <text v-else-if="purchaseState === 'rejected'" class="purchase-tip muted">卖家拒绝了申请，可再次发起或私信沟通</text>
      <text v-else class="purchase-tip muted">线下见面验货付款，平台不收取任何费用</text>
    </view>

    <!-- 仅发布者本人可见：删除商品 -->
    <button v-if="isOwner" class="delete-btn" @click="deleteGoods">🗑 删除这件商品</button>
  </view>
</template>

<script>
import { request, getUser } from '../../common/request.js';
import { buildChatUrl } from '../../common/chat.js';

export default {
  data() {
    return {
      goodsId: null,
      currentUserId: 0,
      purchaseRequest: null,
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
    isOwner() {
      return Boolean(this.detail && this.detail.user_id &&
        Number(this.detail.user_id) === this.currentUserId);
    },
    sellerCaption() {
      if (!this.detail || !this.detail.user_id) return '平台商品 · 暂不支持私信';
      return this.isOwner ? '这是你发布的商品' : '校园卖家 · 可私信咨询';
    },
    // 我（买家）对该商品的购买申请状态：none / pending / accepted / rejected
    purchaseState() {
      if (!this.purchaseRequest) return 'none';
      const map = { 0: 'pending', 1: 'accepted', 2: 'rejected' };
      return map[Number(this.purchaseRequest.status)] || 'none';
    },
    purchaseButtonText() {
      if (this.purchaseState === 'pending') return '⏳ 等待卖家确认';
      if (this.purchaseState === 'accepted') return '✅ 卖家已同意（线下交易）';
      if (this.purchaseState === 'rejected') return '🛒 再次发起购买申请';
      return '🛒 确认购买（发起申请）';
    }
  },
  onLoad(options) {
    this.goodsId = options.id;
    const user = getUser();
    this.currentUserId = Number(user && user.id) || 0;
    this.getDetail();
    this.loadPurchaseState();
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
    // 查询我对该商品的购买申请状态（未登录时跳过）
    async loadPurchaseState() {
      if (!uni.getStorageSync('token') || !this.goodsId) return;
      try {
        const data = await request({
          url: `/api/purchase/requests?role=buyer&goodsId=${this.goodsId}`,
          method: 'GET'
        });
        const list = (data && data.list) || [];
        this.purchaseRequest = list.length ? list[0] : null;
      } catch (e) {
        this.purchaseRequest = null;
      }
    },
    // 买家发起确认购买申请
    createPurchaseRequest() {
      if (this.purchaseState === 'pending' || this.purchaseState === 'accepted') return;
      if (!uni.getStorageSync('token')) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 500);
        return;
      }
      uni.showModal({
        title: '确认购买',
        content: '将向卖家发起购买申请，线下见面验货付款。确认发起吗？',
        confirmText: '发起申请',
        success: (r) => {
          if (!r.confirm) return;
          uni.showLoading({ title: '提交中', mask: true });
          request({ url: '/api/purchase/requests', method: 'POST', data: { goodsId: Number(this.goodsId) } })
            .then(() => {
              uni.hideLoading();
              uni.showToast({ title: '已发起，等待卖家确认', icon: 'success' });
              this.loadPurchaseState();
            })
            .catch((e) => {
              uni.hideLoading();
              uni.showToast({ title: (e && e.message) || '发起失败', icon: 'none' });
            });
        }
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
    },
    openSeller() {
      if (!this.detail.user_id || this.isOwner) return;
      this.goChat();
    },
    goChat() {
      if (!this.detail.user_id) {
        uni.showToast({ title: '该商品暂不支持联系卖家', icon: 'none' });
        return;
      }
      if (this.isOwner) {
        uni.showToast({ title: '不能和自己聊天哦', icon: 'none' });
        return;
      }
      if (!uni.getStorageSync('token')) {
        uni.showToast({ title: '请先登录后再联系卖家', icon: 'none' });
        setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 400);
        return;
      }
      const url = buildChatUrl({
        peerId: this.detail.user_id,
        name: this.detail.nickname || '卖家',
        avatar: this.detail.avatar || '',
        goods: {
          id: this.detail.id,
          title: this.detail.title,
          price: this.detail.price,
          image: this.detail.image
        }
      });
      uni.navigateTo({ url });
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
.info {
  margin-top: 20rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: #fff;
}
.price {
  font-size: 40rpx;
  color: #ff4d4f;
  font-weight: bold;
  margin-bottom: 20rpx;
}
.title {
  font-size: 32rpx;
  color: #222;
}
.desc {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}
.seller-card {
  margin-top: 20rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  border-radius: 12rpx;
  background: #fff;
}
.seller-card.clickable:active {
  background: #f8fbff;
}
.seller-avatar {
  width: 72rpx;
  height: 72rpx;
  flex: none;
  border-radius: 50%;
  background: #eef4ff;
}
.seller-avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b85e4;
  font-size: 28rpx;
  font-weight: 700;
}
.seller-info {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.seller-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.seller-name {
  font-size: 28rpx;
  color: #222;
  font-weight: 600;
}
.owner-badge {
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
  color: #b07a3a;
  background: #fff4e5;
  font-size: 20rpx;
}
.seller-caption {
  color: #999;
  font-size: 24rpx;
}
.seller-arrow {
  flex: none;
  color: #bbb;
  font-size: 40rpx;
  line-height: 1;
}
.bottom-actions {
  margin-top: 40rpx;
  display: flex;
  gap: 16rpx;
}
.collect-btn,
.chat-btn {
  flex: 1;
  margin: 0;
  padding: 20rpx;
  border-radius: 12rpx;
  color: #fff;
  text-align: center;
  font-size: 30rpx;
  line-height: 1.8;
}
.collect-btn {
  background: #2b85e4;
}
.chat-btn {
  background: linear-gradient(90deg, #ff7a45, #ff4d4f);
  font-weight: 600;
}
.collect-btn::after,
.chat-btn::after {
  border: none;
}
.delete-btn {
  margin-top: 24rpx;
  width: 100%;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #fff;
  color: #e64340;
  border: 2rpx solid #f3c0be;
  text-align: center;
  font-size: 30rpx;
  line-height: 1.8;
}
.delete-btn::after {
  border: none;
}
.purchase-row {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}
.purchase-btn {
  width: 100%;
  padding: 22rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #ff9f43, #ff7a45);
  color: #fff;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.6;
  text-align: center;
}
.purchase-btn::after {
  border: none;
}
.purchase-btn[disabled] {
  background: #e8e8e8;
  color: #999;
}
.purchase-tip {
  font-size: 24rpx;
  text-align: center;
  color: #999;
}
.purchase-tip.ok {
  color: #1e9e63;
}
.purchase-tip.muted {
  color: #bbb;
}
</style>
