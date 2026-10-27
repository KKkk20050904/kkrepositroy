<template>
  <view class="collect-page">
    <view v-if="collectList.length===0 && !loading" class="empty">
      <text>暂无收藏商品</text>
    </view>
    <view class="goods-grid">
      <view
        v-for="item in collectList"
        :key="item.collect_id"
        class="goods-card"
        @click="goDetail(item.id)"
      >
        <image class="goods-img" :src="item.image" mode="aspectFill"></image>
        <view class="goods-info">
          <view class="goods-title">{{ item.title }}</view>
          <view class="goods-price">¥{{ item.price }}</view>
        </view>
      </view>
    </view>
    <view class="load-tip">
      <text v-if="loading">加载中...</text>
      <text v-else-if="noMore">— 没有更多 —</text>
    </view>
  </view>
</template>
<script>
export default {
  data() {
    return {
      collectList: [],
      page: 1,
      pageSize: 10,
      loading: false,
      noMore: false
    }
  },
  onLoad() {
    this.getCollectList()
  },
  onReachBottom() {
    if (this.loading || this.noMore) return
    this.page++
    this.getCollectList()
  },
  onPullDownRefresh() {
    this.reset()
    this.getCollectList(()=>uni.stopPullDownRefresh())
  },
  methods: {
    reset(){
      this.page = 1
      this.collectList = []
      this.noMore = false
    },
    getCollectList(callback) {
      this.loading = true
      uni.request({
        url: "http://localhost:3000/api/collect",
        header: { token: uni.getStorageSync('token') },
        data: { page: this.page, pageSize: this.pageSize },
        success: (res) => {
          if (res.data.code === 200) {
            const { list, total } = res.data.data
            if (this.page === 1) {
              this.collectList = list
            } else {
              this.collectList = [...this.collectList, ...list]
            }
            this.noMore = this.collectList.length >= total
          } else {
            uni.showToast({ title: res.data.msg, icon: 'none' })
          }
        },
        complete: () => {
          this.loading = false
          callback && callback()
        }
      })
    },
    goDetail(id) {
      uni.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` })
    }
  }
}
</script>
<style scoped>
.collect-page{
  min-height:100vh;
  background:#f5f6f8;
  padding:20rpx;
}
.empty{
  text-align:center;
  margin-top:200rpx;
  color:#999;
  font-size:28rpx;
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
}
.goods-info {
  padding: 16rpx;
}
.goods-title {
  font-size: 28rpx;
  color: #333;
  overflow:hidden;
  text-overflow:ellipsis;
  display:-webkit-box;
  -webkit-line-clamp:2;
  -webkit-box-orient:vertical;
}
.goods-price {
  margin-top:10rpx;
  font-size:32rpx;
  color:#ff4d4f;
  font-weight:bold;
}
.load-tip{
  text-align:center;
  padding:30rpx 0;
  font-size:26rpx;
  color:#999;
}
</style>