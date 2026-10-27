<template>
  <el-card class="goods-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>{{ goods.name }}</span>
        <el-button
          circle
          :icon="isCollect ? StarFilled : Star"
          :type="isCollect ? 'warning' : ''"
          @click="handleToggle"
        />
      </div>
    </template>
    <div class="price">¥{{ goods.price }}</div>
    <p class="desc">{{ goods.desc }}</p>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { useCollectStore } from '../store/collect'

const props = defineProps(['goods'])
const collectStore = useCollectStore()

const isCollect = computed(() => collectStore.isCollected(props.goods.id))
const handleToggle = () => {
  collectStore.toggleCollect(props.goods)
}
</script>

<style scoped>
.goods-card {
  width: 260px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
  margin: 8px 0;
}
.desc {
  color: #666;
  font-size: 14px;
  margin: 0;
}
</style>
