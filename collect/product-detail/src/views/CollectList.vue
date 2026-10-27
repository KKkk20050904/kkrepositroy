<template>
  <div class="collect-page">
    <h2>我的收藏</h2>
    <div v-if="collectStore.collectList.length === 0" class="empty">
      暂无收藏商品，快去商品列表看看吧
    </div>
    <div class="goods-wrap" v-else>
      <GoodsCard v-for="item in collectStore.collectList" :key="item.id" :goods="item"/>
    </div>
  </div>
</template>

<script setup>
import GoodsCard from '../components/GoodsCard.vue'
import { useCollectStore } from '../store/collect'
const collectStore = useCollectStore()
</script>

<style scoped>
.collect-page {
  width: 900px;
  margin: 40px auto;
}
.goods-wrap {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
}
.empty {
  margin-top: 30px;
  color: #999;
  font-size:16px;
}
</style>