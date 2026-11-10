<template>
  <view class="page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索书籍、数码、生活用品..."
        confirm-type="search"
        @confirm="handleSearch"
      />
      <text class="search-btn" @click="handleSearch">搜索</text>
    </view>

    <!-- 分类筛选栏（横向滚动） -->
    <scroll-view class="category-bar" scroll-x>
      <view
        v-for="item in categories"
        :key="item.id"
        class="category-item"
        :class="{ active: item.id === categoryId }"
        @click="changeCategory(item.id)"
      >
        {{ item.name }}
      </view>
    </scroll-view>

    <!-- 商品列表 -->
    <view v-if="goodsList.length" class="goods-list">
      <view
        v-for="item in goodsList"
        :key="item.id"
        class="goods-card"
        @click="goDetail(item.id)"
      >
        <image class="goods-img" :src="item.cover" mode="aspectFill" />
        <view class="goods-info">
          <text class="goods-title">{{ item.title }}</text>
          <text class="goods-price">¥{{ item.price }}</text>
          <view class="goods-meta">
            <text class="seller">{{ item.seller_name }}</text>
            <text class="time">{{ formatTime(item.create_time) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 列表底部状态：加载中 / 空数据 / 没有更多 -->
    <view class="list-status">
      <text v-if="loading">加载中...</text>
      <text v-else-if="!goodsList.length">暂无相关商品</text>
      <text v-else-if="!hasMore">—— 没有更多了 ——</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 后端接口地址：
      // HBuilderX 内置浏览器/微信开发者工具模拟器可直接用 localhost；
      // 真机调试时改成电脑的局域网 IP，例如 http://192.168.1.100:3000
      baseUrl: 'http://localhost:3000',

      keyword: '',
      categoryId: 0,     // 0 = 全部
      page: 1,
      pageSize: 10,
      goodsList: [],
      total: 0,
      hasMore: true,
      loading: false,

      // 分类兜底数据（正常应请求孙八的 GET /api/category，失败时用这个）
      categories: [
        { id: 0, name: '全部' },
        { id: 1, name: '教材书籍' },
        { id: 2, name: '数码电子' },
        { id: 3, name: '生活用品' },
        { id: 4, name: '服饰鞋包' },
        { id: 5, name: '运动器材' },
        { id: 6, name: '其他' }
      ]
    }
  },

  // 页面加载时请求分类和第一页商品
  onLoad() {
    this.getCategories()
    this.loadGoods()
  },

  // 下拉刷新：回到第一页重新加载
  onPullDownRefresh() {
    this.page = 1
    this.loadGoods()
  },

  // 上拉触底：还有下一页就继续加载
  onReachBottom() {
    if (this.hasMore && !this.loading) {
      this.page++
      this.loadGoods()
    }
  },

  methods: {
    // 获取分类列表（接口由孙八负责：GET /api/category）
    getCategories() {
      uni.request({
        url: `${this.baseUrl}/api/category`,
        success: res => {
          if (res.data.code === 0 && res.data.data.length) {
            this.categories = [{ id: 0, name: '全部' }, ...res.data.data]
          }
        }
      })
    },

    // 搜索：回到第一页重新查
    handleSearch() {
      this.page = 1
      this.loadGoods()
    },

    // 切换分类：回到第一页重新查
    changeCategory(id) {
      if (this.categoryId === id) return
      this.categoryId = id
      this.page = 1
      this.loadGoods()
    },

    // 加载商品列表（核心请求，对应 GET /api/goods）
    loadGoods() {
      this.loading = true
      uni.request({
        url: `${this.baseUrl}/api/goods`,
        data: {
          keyword: this.keyword,
          category_id: this.categoryId,
          page: this.page,
          pageSize: this.pageSize
        },
        success: res => {
          const data = res.data
          if (data.code === 0) {
            const list = data.data.list
            // 第一页直接覆盖，翻页追加
            this.goodsList = this.page === 1 ? list : this.goodsList.concat(list)
            this.hasMore = data.data.hasMore
            this.total = data.data.total
          } else {
            uni.showToast({ title: data.message || '加载失败', icon: 'none' })
          }
        },
        fail: () => {
          uni.showToast({ title: '网络异常，请检查后端服务', icon: 'none' })
        },
        complete: () => {
          this.loading = false
          uni.stopPullDownRefresh()
        }
      })
    },

    // 跳转商品详情（赵六负责：pages/goods-detail/goods-detail）
    goDetail(id) {
      uni.navigateTo({ url: `/pages/goods-detail/goods-detail?id=${id}` })
    },

    // 时间格式化成 yyyy-MM-dd
    formatTime(str) {
      if (!str) return ''
      return str.slice(0, 10)
    }
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f6fa;
  padding-bottom: 30rpx;
}

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  background: #ffffff;
}
.search-input {
  flex: 1;
  height: 68rpx;
  padding: 0 24rpx;
  background: #f5f6fa;
  border-radius: 34rpx;
  font-size: 28rpx;
}
.search-btn {
  margin-left: 20rpx;
  padding: 12rpx 28rpx;
  background: #07c160;
  color: #fff;
  font-size: 28rpx;
  border-radius: 34rpx;
}

/* 分类栏 */
.category-bar {
  white-space: nowrap;
  background: #ffffff;
  padding: 10rpx 0 20rpx;
}
.category-item {
  display: inline-block;
  margin-left: 24rpx;
  padding: 10rpx 30rpx;
  font-size: 26rpx;
  color: #666;
  background: #f5f6fa;
  border-radius: 30rpx;
}
.category-item.active {
  background: #07c160;
  color: #fff;
}

/* 商品卡片 */
.goods-list {
  padding: 20rpx 24rpx;
}
.goods-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}
.goods-img {
  width: 180rpx;
  height: 180rpx;
  border-radius: 12rpx;
  background: #eee;
  flex-shrink: 0;
}
.goods-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.goods-title {
  font-size: 30rpx;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.goods-price {
  font-size: 34rpx;
  color: #ff4d2e;
  font-weight: bold;
}
.goods-meta {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

/* 底部状态 */
.list-status {
  text-align: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: #999;
}
</style>
