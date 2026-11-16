<template>
  <view class="purchase-page">
    <!-- 角色切换：我收到的 / 我发出的 -->
    <view class="tabs">
      <view class="tab" :class="{ 'tab-active': role === 'seller' }" @click="switchRole('seller')">
        <text>我收到的申请</text>
        <text v-if="pendingCount" class="tab-badge">{{ pendingCount }}</text>
      </view>
      <view class="tab" :class="{ 'tab-active': role === 'buyer' }" @click="switchRole('buyer')">
        <text>我发出的申请</text>
      </view>
    </view>

    <view v-if="loading && list.length === 0" class="state">加载中…</view>
    <view v-else-if="loadError" class="state">
      <text>加载失败，请检查网络后重试</text>
      <button class="retry-btn" @click="loadList">重新加载</button>
    </view>
    <view v-else-if="list.length === 0" class="state">
      <text v-if="role === 'seller'">还没有买家发起购买申请</text>
      <text v-else>你还没有发起过购买申请</text>
      <text class="state-tip">买家在商品详情页点「确认购买」即可发起申请</text>
    </view>

    <view v-else class="list">
      <view v-for="item in list" :key="item.id" class="card">
        <view class="card-main" @click="goDetail(item.goods_id)">
          <image class="goods-img" :src="resolveImageUrl(item.image)" mode="aspectFill"></image>
          <view class="card-info">
            <text class="goods-title">{{ item.title }}</text>
            <text class="goods-price">¥{{ item.price }}</text>
            <text class="peer-line">
              {{ role === 'seller' ? '买家：' : '卖家：' }}{{ item.peer_name || item.peer_username }}
            </text>
            <text class="time">{{ formatTime(item.created_at) }}</text>
          </view>
          <view class="status" :class="'status-' + item.status">{{ statusText(item.status) }}</view>
        </view>

        <view v-if="role === 'seller' && item.status === 0" class="actions">
          <button class="btn-reject" @click="handle(item, 'reject')">拒绝</button>
          <button class="btn-accept" @click="handle(item, 'accept')">同意购买</button>
        </view>
        <view v-else-if="role === 'seller' && item.status === 1" class="actions">
          <text class="action-tip">已同意：请与买家约好时间地点线下交易</text>
        </view>
        <view v-else-if="role === 'seller' && item.status === 2" class="actions">
          <text class="action-tip muted">已拒绝该申请</text>
        </view>
        <view v-else-if="role === 'buyer' && item.status === 0" class="actions">
          <text class="action-tip muted">等待卖家确认中…</text>
        </view>
        <view v-else-if="role === 'buyer' && item.status === 1" class="actions">
          <text class="action-tip">卖家已同意：请与卖家约好时间地点线下交易</text>
        </view>
        <view v-else-if="role === 'buyer' && item.status === 2" class="actions">
          <text class="action-tip muted">卖家拒绝了申请，可以尝试再次发起或私信沟通</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from '../../common/request.js';
import { resolveImageUrl } from '../../common/chat.js';

export default {
  data() {
    return {
      role: 'seller',
      list: [],
      pendingCount: 0,
      loading: false,
      loadError: false
    };
  },
  onLoad() {
    this.loadList();
  },
  onShow() {
    this.loadList();
  },
  onPullDownRefresh() {
    this.loadList().finally(() => uni.stopPullDownRefresh());
  },
  methods: {
    resolveImageUrl,
    switchRole(role) {
      if (this.role === role) return;
      this.role = role;
      this.list = [];
      this.loadList();
    },
    statusText(status) {
      return status === 0 ? '待处理' : status === 1 ? '已同意' : '已拒绝';
    },
    formatTime(str) {
      if (!str) return '';
      return String(str).replace('T', ' ').slice(0, 16);
    },
    async loadList() {
      this.loading = true;
      this.loadError = false;
      try {
        const data = await request({
          url: `/api/purchase/requests?role=${this.role}`,
          method: 'GET'
        });
        const list = (data && data.list) || [];
        this.list = list;
        // 卖家视角统计待处理数量
        if (this.role === 'seller') {
          this.pendingCount = list.filter((x) => Number(x.status) === 0).length;
        }
      } catch (e) {
        this.loadError = true;
      } finally {
        this.loading = false;
      }
    },
    handle(item, action) {
      uni.showModal({
        title: action === 'accept' ? '同意购买申请' : '拒绝购买申请',
        content: action === 'accept'
          ? '确认同意该买家的购买申请？请与买家约定线下交易时间地点。'
          : '确认拒绝该买家的购买申请？',
        confirmText: action === 'accept' ? '同意' : '拒绝',
        success: (r) => {
          if (!r.confirm) return;
          uni.showLoading({ title: '处理中', mask: true });
          request({
            url: `/api/purchase/requests/${item.id}`,
            method: 'PUT',
            data: { action }
          })
            .then(() => {
              uni.hideLoading();
              uni.showToast({ title: action === 'accept' ? '已同意' : '已拒绝', icon: 'success' });
              this.loadList();
            })
            .catch((e) => {
              uni.hideLoading();
              uni.showToast({ title: (e && e.message) || '操作失败', icon: 'none' });
            });
        }
      });
    },
    goDetail(goodsId) {
      uni.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${goodsId}` });
    }
  }
};
</script>

<style scoped>
.purchase-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 20rpx;
  box-sizing: border-box;
}
.tabs {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 8rpx;
  margin-bottom: 20rpx;
}
.tab {
  flex: 1;
  position: relative;
  height: 76rpx;
  line-height: 76rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666;
  border-radius: 12rpx;
}
.tab-active {
  background: #2b85e4;
  color: #fff;
  font-weight: 600;
}
.tab-badge {
  display: inline-block;
  min-width: 32rpx;
  height: 32rpx;
  line-height: 32rpx;
  padding: 0 8rpx;
  margin-left: 8rpx;
  border-radius: 999rpx;
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
}
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
  color: #999;
  font-size: 28rpx;
}
.state-tip {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #bbb;
}
.retry-btn {
  margin-top: 24rpx;
  padding: 0 40rpx;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 26rpx;
  background: #2b85e4;
  color: #fff;
  border-radius: 999rpx;
}
.card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}
.card-main {
  display: flex;
  padding: 24rpx;
  align-items: center;
}
.goods-img {
  width: 150rpx;
  height: 150rpx;
  border-radius: 12rpx;
  background: #eee;
  flex: none;
}
.card-info {
  flex: 1;
  min-width: 0;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.goods-title {
  font-size: 28rpx;
  color: #222;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.goods-price {
  font-size: 30rpx;
  color: #ff4d4f;
  font-weight: 600;
}
.peer-line {
  font-size: 24rpx;
  color: #666;
}
.time {
  font-size: 22rpx;
  color: #bbb;
}
.status {
  flex: none;
  margin-left: 12rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
}
.status-0 {
  background: #fff7e6;
  color: #e58e26;
}
.status-1 {
  background: #e9f9ef;
  color: #1e9e63;
}
.status-2 {
  background: #fef0f0;
  color: #e64340;
}
.actions {
  display: flex;
  gap: 16rpx;
  padding: 0 24rpx 24rpx;
  align-items: center;
}
.btn-reject,
.btn-accept {
  flex: 1;
  height: 76rpx;
  line-height: 76rpx;
  font-size: 28rpx;
  border-radius: 12rpx;
  padding: 0;
}
.btn-reject {
  background: #fff;
  color: #666;
  border: 2rpx solid #ddd;
}
.btn-accept {
  background: linear-gradient(90deg, #2b85e4, #4f9bff);
  color: #fff;
  font-weight: 600;
}
.btn-reject::after,
.btn-accept::after {
  border: none;
}
.action-tip {
  font-size: 24rpx;
  color: #1e9e63;
  padding-bottom: 20rpx;
}
.action-tip.muted {
  color: #999;
}
</style>
