import { defineStore } from 'pinia'

export const useCollectStore = defineStore('collect', {
  state: () => ({
    // 收藏数组，从localStorage读取
    collectList: JSON.parse(localStorage.getItem('collectList')) || []
  }),
  actions: {
    // 添加收藏
    addCollect(goods) {
      // 判断是否已经收藏
      const has = this.collectList.some(item => item.id === goods.id)
      if (!has) {
        this.collectList.push(goods)
        this.saveLocal()
      }
    },
    // 取消收藏
    removeCollect(id) {
      this.collectList = this.collectList.filter(item => item.id !== id)
      this.saveLocal()
    },
    // 切换收藏状态（有就删，没有就加）
    toggleCollect(goods) {
      const has = this.collectList.some(item => item.id === goods.id)
      if (has) {
        this.removeCollect(goods.id)
      } else {
        this.addCollect(goods)
      }
    },
    // 判断该商品是否已收藏
    isCollected(id) {
      return this.collectList.some(item => item.id === id)
    },
    // 持久化到本地存储
    saveLocal() {
      localStorage.setItem('collectList', JSON.stringify(this.collectList))
    }
  }
})