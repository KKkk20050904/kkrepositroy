<template>
  <view class="page">
    <!-- 图片上传区 -->
    <view class="section">
      <view class="section-title">商品图片（最多 9 张，第一张为封面）</view>
      <view class="image-grid">
        <view class="image-item" v-for="(img, index) in imageList" :key="index">
          <image class="image" :src="img" mode="aspectFill" @click="previewImage(index)" />
          <view class="delete-btn" @click.stop="removeImage(index)">×</view>
        </view>
        <view class="image-add" v-if="imageList.length < 9" @click="chooseImage">
          <text class="add-icon">＋</text>
          <text class="add-text">上传</text>
        </view>
      </view>
    </view>

    <!-- 标题 -->
    <view class="form-item">
      <text class="label">标题</text>
      <input
        class="input"
        v-model="form.title"
        placeholder="一句话描述你的闲置物品"
        placeholder-class="ph"
        maxlength="50"
      />
    </view>

    <!-- 价格 -->
    <view class="form-item">
      <text class="label">价格</text>
      <view class="price-wrap">
        <text class="rmb">¥</text>
        <input
          class="input"
          v-model="form.price"
          type="digit"
          placeholder="转让价格"
          placeholder-class="ph"
        />
      </view>
    </view>

    <!-- 原价（选填） -->
    <view class="form-item">
      <text class="label">原价</text>
      <view class="price-wrap">
        <text class="rmb">¥</text>
        <input
          class="input"
          v-model="form.originalPrice"
          type="digit"
          placeholder="选填"
          placeholder-class="ph"
        />
      </view>
    </view>

    <!-- 分类 -->
    <view class="form-item" @click="showCategory = true">
      <text class="label">分类</text>
      <text class="value" :class="{ ph: !form.categoryId }">{{ selectedCategoryName || '请选择分类' }}</text>
      <text class="arrow">›</text>
    </view>

    <!-- 描述 -->
    <view class="form-item desc-item">
      <text class="label">描述</text>
      <textarea
        class="textarea"
        v-model="form.description"
        placeholder="描述物品成色、入手渠道、转让原因、交易地点等"
        placeholder-class="ph"
        maxlength="500"
      />
      <text class="counter">{{ form.description.length }}/500</text>
    </view>

    <!-- 提交 -->
    <button class="submit-btn" :loading="submitting" :disabled="submitting" @click="submit">发布</button>

    <!-- 分类选择弹层 -->
    <view class="mask" v-if="showCategory" @click="showCategory = false">
      <view class="panel" @click.stop>
        <view class="panel-title">选择分类</view>
        <view class="category-list">
          <view
            class="category-item"
            :class="{ active: form.categoryId === c.id }"
            v-for="c in categories"
            :key="c.id"
            @click="selectCategory(c)"
          >
            <text>{{ c.name }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { publishGoods, getCategories } from '../../api/goods.js';
import { uploadImage } from '../../api/request.js';

// 本地兜底分类（后端分类接口未就绪时使用，与 sql/init.sql 种子数据一致）
const FALLBACK_CATEGORIES = [
  { id: 1, name: '教材书籍' },
  { id: 2, name: '数码电子' },
  { id: 3, name: '生活用品' },
  { id: 4, name: '服饰鞋包' },
  { id: 5, name: '运动户外' },
  { id: 6, name: '美妆个护' },
  { id: 7, name: '其他' }
];

export default {
  data() {
    return {
      imageList: [],      // 待上传的本地图片路径
      showCategory: false,
      categories: FALLBACK_CATEGORIES,
      submitting: false,
      form: {
        title: '',
        price: '',
        originalPrice: '',
        categoryId: null,
        description: ''
      }
    };
  },
  computed: {
    selectedCategoryName() {
      const c = this.categories.find((x) => x.id === this.form.categoryId);
      return c ? c.name : '';
    }
  },
  onLoad() {
    // 发布需要登录：未登录时引导用户去登录页
    if (!uni.getStorageSync('token')) {
      uni.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 500);
      return;
    }
    this.loadCategories();
  },
  methods: {
    // 加载分类：优先请求后端接口，失败使用本地兜底
    async loadCategories() {
      try {
        const list = await getCategories();
        if (Array.isArray(list) && list.length) {
          this.categories = list;
        }
      } catch (e) {
        console.log('分类接口未就绪，使用本地兜底分类');
      }
    },

    // 选择图片（相册/拍照，最多补满 9 张）
    chooseImage() {
      const remain = 9 - this.imageList.length;
      uni.chooseImage({
        count: remain,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          this.imageList.push(...res.tempFilePaths);
        }
      });
    },

    removeImage(index) {
      this.imageList.splice(index, 1);
    },

    previewImage(index) {
      uni.previewImage({ urls: this.imageList, current: this.imageList[index] });
    },

    selectCategory(c) {
      this.form.categoryId = c.id;
      this.showCategory = false;
    },

    // 表单校验，返回错误信息；通过则返回空字符串
    validate() {
      if (!this.form.title.trim()) return '请填写商品标题';
      if (!this.form.price || Number(this.form.price) <= 0) return '请填写正确的价格';
      if (Number(this.form.price) > 999999) return '价格超出范围';
      if (!this.form.categoryId) return '请选择分类';
      if (this.imageList.length === 0) return '请至少上传一张图片';
      return '';
    },

    // 提交发布：先逐张上传图片，再提交商品信息
    async submit() {
      if (this.submitting) return;
      if (!uni.getStorageSync('token')) {
        uni.showToast({ title: '请先登录', icon: 'none' });
        setTimeout(() => uni.navigateTo({ url: '/pages/login/login' }), 500);
        return;
      }
      const errMsg = this.validate();
      if (errMsg) {
        uni.showToast({ title: errMsg, icon: 'none' });
        return;
      }

      this.submitting = true;
      uni.showLoading({ title: '发布中...', mask: true });
      try {
        // 第一步：逐张上传图片，得到图片URL
        const urls = [];
        for (let i = 0; i < this.imageList.length; i++) {
          uni.showLoading({ title: `上传图片 ${i + 1}/${this.imageList.length}`, mask: true });
          const url = await uploadImage(this.imageList[i]);
          urls.push(url);
        }

        // 第二步：提交商品信息
        uni.showLoading({ title: '发布中...', mask: true });
        await publishGoods({
          title: this.form.title.trim(),
          description: this.form.description.trim(),
          price: Number(this.form.price),
          originalPrice: this.form.originalPrice ? Number(this.form.originalPrice) : null,
          categoryId: this.form.categoryId,
          images: urls
        });

        uni.hideLoading();
        uni.showToast({ title: '发布成功', icon: 'success' });
        setTimeout(() => {
          // 发布成功返回上一页；若从首页 tab 进入，可改为：
          // uni.switchTab({ url: '/pages/index/index' })
          const pages = getCurrentPages();
          if (pages.length > 1) {
            uni.navigateBack();
          } else {
            uni.switchTab({ url: '/pages/index/index' });
          }
        }, 1000);
      } catch (e) {
        uni.hideLoading();
        console.error('发布失败', e);
        // 具体错误信息已在 request / uploadImage 中统一 toast
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f6f7f9;
  padding-bottom: 120rpx;
}

.section {
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
}

.image-item {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  margin: 0 16rpx 16rpx 0;
}

.image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  background: #eee;
}

.delete-btn {
  position: absolute;
  top: -14rpx;
  right: -14rpx;
  width: 40rpx;
  height: 40rpx;
  line-height: 36rpx;
  text-align: center;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 28rpx;
}

.image-add {
  width: 200rpx;
  height: 200rpx;
  border: 2rpx dashed #ccc;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  color: #999;
}

.add-icon {
  font-size: 56rpx;
  line-height: 1;
}

.add-text {
  font-size: 24rpx;
  margin-top: 8rpx;
}

.form-item {
  display: flex;
  align-items: center;
  background: #fff;
  margin: 20rpx;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  font-size: 30rpx;
}

.label {
  width: 140rpx;
  color: #333;
  font-weight: 500;
  flex-shrink: 0;
}

.input {
  flex: 1;
  color: #333;
}

.price-wrap {
  flex: 1;
  display: flex;
  align-items: center;
}

.rmb {
  color: #ff4d2d;
  font-weight: 600;
  margin-right: 8rpx;
}

.value {
  flex: 1;
  color: #333;
}

.ph {
  color: #bbb;
}

.arrow {
  color: #ccc;
  font-size: 36rpx;
  margin-left: 8rpx;
}

.desc-item {
  flex-direction: column;
  align-items: flex-start;
}

.textarea {
  width: 100%;
  height: 220rpx;
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #333;
}

.counter {
  align-self: flex-end;
  font-size: 24rpx;
  color: #bbb;
  margin-top: 8rpx;
}

.submit-btn {
  margin: 40rpx 20rpx 0;
  background: #2b85ff;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
}

.submit-btn[disabled] {
  opacity: 0.7;
  color: #fff;
  background: #2b85ff;
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
  display: flex;
  align-items: flex-end;
}

.panel {
  width: 100%;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx 24rpx 60rpx;
}

.panel-title {
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  padding: 16rpx 0 24rpx;
}

.category-list {
  display: flex;
  flex-wrap: wrap;
}

.category-item {
  width: 30%;
  margin: 12rpx 1.66%;
  text-align: center;
  padding: 20rpx 0;
  border-radius: 12rpx;
  background: #f5f6f8;
  font-size: 28rpx;
  color: #333;
}

.category-item.active {
  background: #e8f1ff;
  color: #2b85ff;
  font-weight: 600;
}
</style>
