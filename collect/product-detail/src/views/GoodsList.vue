<template>
  <div class="list-page">
    <h2>商品列表</h2>
    <div class="goods-wrap">
      <GoodsCard v-for="item in goodsArr" :key="item.id" :goods="item" />
    </div>
  </div>
</template>

<script setup>
import GoodsCard from '../components/GoodsCard.vue'

// 模拟后端商品数据
const goodsArr = [
  {
    id: 1,
    name: "无线蓝牙耳机",
    price: 129,
    desc: "高清降噪，超长续航"
  },
  {
    id: 2,
    name: "机械键盘",
    price: 249,
    desc: "青轴手感，RGB背光"
  },
  {
    id: 3,
    name: "无线鼠标",
    price: 89,
    desc: "静音按键，可充电"
  }
]
</script>

<style scoped>
.list-page {
  width: 900px;
  margin: 40px auto;
}
.goods-wrap {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
}
</style>