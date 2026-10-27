<template>
  <div class="app">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="商品列表" name="list">
        <GoodsList />
      </el-tab-pane>
      <el-tab-pane label="我的收藏" name="collect">
        <CollectList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import GoodsList from './views/GoodsList.vue'
import CollectList from './views/CollectList.vue'

const activeTab = ref('list')
</script>

<style>
*{
  margin: 0;
  padding:0;
  box-sizing: border-box;
}
</style>