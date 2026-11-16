<template>
  <view class="collect-page">
    <view v-if="collectList.length === 0 && !loading" class="empty">
      <text>暂无收藏商品</text>
    </view>
    <view class="goods-grid">
      <view v-for="item in collectList" :key="item.collect_id" class="goods-card" @click="goDetail(item.id)">
        <image class="goods-img" :src="item.image" mode="aspectFill"></image>
        <view class="goods-info">
          <view class="goods-title">{{ item.title }}</view>
          <view class="goods-footer">
            <view class="goods-price">¥{{ item.price }}</view>
            <text v-if="canChat(item)" class="chat-mini" @click.stop="contactSeller(item)">💬 联系卖家</text>
          </view>
        </view>
      </view>
    </view>
    <view class="load-tip">
      <text v-if="loading">加载中...</text>
      <text v-else-if="noMore && collectList.length">— 没有更多 —</text>
    </view>
  </view>
</template>

<script>
import { request, getUser } from '../../common/request.js';
import { buildChatUrl } from '../../common/chat.js';

export default {
  data() {
    return {
      collectList: [],
      currentUserId: 0,
      page: 1,
      pageSize: 10,
      loading: false,
      noMore: false
    };
  },
  onLoad() {
    const user = getUser();
    this.currentUserId = Number(user && user.id) || 0;
    this.getCollectList();
  },
  onReachBottom() {
    if (this.loading || this.noMore) return;
    this.page++;
    this.getCollectList();
  },
  onPullDownRefresh() {
    this.reset();
    this.getCollectList(() => uni.stopPullDownRefresh());
  },
  methods: {
    reset() {
      this.page = 1;
      this.collectList = [];
      this.noMore = false;
    },
    async getCollectList(callback) {
      this.loading = true;
      try {
        const data = await request({
          url: '/api/collect',
          method: 'GET',
          data: { page: this.page, pageSize: this.pageSize }
        });
        const { list, total } = data;
        if (this.page === 1) {
          this.collectList = list;
        } else {
          this.collectList = [...this.collectList, ...list];
        }
        this.noMore = this.collectList.length >= total;
      } catch (e) {
        uni.showToast({ title: (e && e.message) || '获取收藏列表失败', icon: 'none' });
      } finally {
        this.loading = false;
        callback && callback();
      }
    },
    goDetail(id) {
      uni.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` });
    },
    canChat(item) {
      return Boolean(item.seller_id) && Number(item.seller_id) !== this.currentUserId;
    },
    contactSeller(item) {
      if (!this.canChat(item)) {
        uni.showToast({ title: item.seller_id ? '不能和自己聊天哦' : '该商品暂不支持私信', icon: 'none' });
        return;
      }
      if (!uni.getStorageSync('token')) {
        uni.showToast({ title: '请先登录后再联系卖家', icon: 'none' });
        setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 400);
        return;
      }
      const url = buildChatUrl({
        peerId: item.seller_id,
        name: item.seller_name,
        avatar: item.seller_avatar || '',
        goods: {
          id: item.id,
          title: item.title,
          price: item.price,
          image: item.image
        }
      });
      uni.navigateTo({ url });
    }
  }
};
</script>

<style scoped>
.collect-page {
  min-height: 100vh;
  background: #f5f6f8;
  padding: 20rpx;
  box-sizing: border-box;
}
.empty {
  text-align: center;
  margin-top: 200rpx;
  color: #999;
  font-size: 28rpx;
}
.goods-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}
.goods-card {
  width: 48.5%;
  background: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}
.goods-img {
  width: 100%;
  height: 320rpx;
  background: #eee;
}
.goods-info {
  padding: 16rpx;
}
.goods-title {
  font-size: 28rpx;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.goods-footer {
  margin-top: 10rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8rpx;
}
.goods-price {
  font-size: 32rpx;
  color: #ff4d4f;
  font-weight: bold;
}
.chat-mini {
  flex: none;
  padding: 6rpx 12rpx;
  border-radius: 999rpx;
  color: #d6332e;
  background: #fff0ed;
  font-size: 20rpx;
  line-height: 1.5;
  white-space: nowrap;
}
.load-tip {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: #999;
}
</style>
