<template>
  <view class="messages-page">
    <view class="messages-hero">
      <view class="hero-topline">
        <text class="hero-kicker">CAMPUS MESSAGES</text>
        <text class="hero-mark">✦</text>
      </view>
      <text class="hero-title">消息</text>
      <text class="hero-subtitle">和同学聊聊好物，让每一次交易更安心</text>
      <view class="hero-summary">
        <text class="summary-dot"></text>
        <text>{{ unreadCount ? `${unreadCount} 条新消息` : '私信与交易咨询' }}</text>
        <text class="summary-arrow">›</text>
      </view>
    </view>

    <view class="messages-content">
      <view class="section-heading">
        <view>
          <text class="section-title">{{ activeTab === 'chats' ? '最近联系' : '找同学聊聊' }}</text>
          <text class="section-caption">{{ activeTab === 'chats' ? '你的交易沟通都在这里' : '选择一位同学开始沟通' }}</text>
        </view>
        <text class="refresh-action" @click="loadActiveTab">刷新</text>
      </view>

      <view class="search-card">
        <text class="search-icon">⌕</text>
        <input
          v-model="keyword"
          class="search-input"
          :placeholder="activeTab === 'chats' ? '搜索聊天记录' : '搜索同学昵称或用户名'"
          confirm-type="search"
          @confirm="loadActiveTab"
        />
        <text v-if="keyword" class="clear-search" @click="clearSearch">×</text>
      </view>

      <view class="message-tabs">
        <view class="message-tab" :class="{ 'tab-active': activeTab === 'chats' }" @click="switchTab('chats')">
          <text>聊天</text>
          <text v-if="unreadCount" class="tab-count">{{ unreadCount > 99 ? '99+' : unreadCount }}</text>
        </view>
        <view class="message-tab" :class="{ 'tab-active': activeTab === 'contacts' }" @click="switchTab('contacts')">
          <text>联系人</text>
        </view>
      </view>

      <view v-if="loadError" class="state-card">
        <text class="state-icon">!</text>
        <text class="state-title">暂时无法加载消息</text>
        <text class="state-caption">请检查网络连接后重试</text>
        <button class="retry-button" @click="loadActiveTab">重新加载</button>
      </view>
      <view v-else-if="loading && visibleItems.length === 0" class="state-card">
        <text class="state-caption">正在为你整理消息…</text>
      </view>
      <view v-else-if="visibleItems.length === 0" class="state-card">
        <text class="state-icon">{{ activeTab === 'chats' ? '♡' : '⌕' }}</text>
        <text class="state-title">{{ emptyTitle }}</text>
        <text class="state-caption">{{ emptyCaption }}</text>
        <button v-if="activeTab === 'chats'" class="retry-button" @click="switchTab('contacts')">找同学聊聊</button>
      </view>
      <view v-else class="conversation-list">
        <view
          v-for="item in visibleItems"
          :key="item.peerId"
          class="conversation-card"
          @click="openChat(item)"
        >
          <view class="avatar-wrap">
            <image v-if="item.avatar" class="conversation-avatar" :src="item.avatar" mode="aspectFill"></image>
            <view v-else class="conversation-avatar avatar-placeholder">{{ item.name.slice(0, 1) }}</view>
            <text v-if="item.unreadCount" class="avatar-unread"></text>
          </view>
          <view class="conversation-copy">
            <view class="conversation-topline">
              <text class="conversation-name">{{ item.name }}</text>
              <text v-if="activeTab === 'chats'" class="conversation-time">{{ formatListTime(item.lastMessageAt) }}</text>
            </view>
            <view class="conversation-bottomline">
              <text class="conversation-preview">{{ activeTab === 'chats' ? item.lastMessage : `校园用户 · ${item.username || '可开始私信'}` }}</text>
              <text v-if="item.unreadCount" class="unread-badge">{{ item.unreadCount > 99 ? '99+' : item.unreadCount }}</text>
              <text v-else-if="activeTab === 'contacts'" class="contact-arrow">›</text>
            </view>
          </view>
        </view>
      </view>

      <view class="safety-note">
        <text class="safety-icon">✓</text>
        <text>友善沟通，线下交易请注意安全</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getContacts, getConversations } from '../../api/message.js'
import { getUser } from '../../common/request.js'

const REFRESH_INTERVAL = 10000

export default {
  data() {
    return {
      activeTab: 'chats',
      conversations: [],
      contacts: [],
      currentUserId: 0,
      keyword: '',
      loading: true,
      loadError: false,
      pollTimer: null,
      searchTimer: null
    }
  },
  computed: {
    unreadCount() {
      return this.conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0)
    },
    visibleItems() {
      const source = this.activeTab === 'chats' ? this.conversations : this.contacts
      const keyword = this.keyword.trim().toLowerCase()
      if (!keyword) return source
      return source.filter((item) => {
        const searchable = `${item.name || ''} ${item.username || ''} ${item.lastMessage || ''}`
        return searchable.toLowerCase().includes(keyword)
      })
    },
    emptyTitle() {
      return this.activeTab === 'chats' ? (this.keyword ? '没有找到相关会话' : '还没有聊天记录') : '没有找到这位同学'
    },
    emptyCaption() {
      return this.activeTab === 'chats' ? '从商品页面联系卖家，开启第一段对话' : '试试昵称或用户名，也可以稍后再找'
    }
  },
  onLoad() {
    const user = getUser()
    this.currentUserId = Number(user && user.id) || 0
    this.loadConversations()
  },
  onShow() {
    if (!this.pollTimer) {
      this.pollTimer = setInterval(this.refreshConversations, REFRESH_INTERVAL)
    }
  },
  onHide() {
    this.stopPolling()
  },
  onUnload() {
    this.stopPolling()
    if (this.searchTimer) clearTimeout(this.searchTimer)
  },
  onPullDownRefresh() {
    this.loadActiveTab().finally(() => uni.stopPullDownRefresh())
  },
  methods: {
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
    async loadConversations() {
      this.loading = true
      this.loadError = false
      try {
        const data = await getConversations()
        this.conversations = data.list
      } catch (error) {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    async loadContacts() {
      this.loading = true
      this.loadError = false
      try {
        const data = await getContacts(this.keyword.trim())
        this.contacts = data.list
      } catch (error) {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    loadActiveTab() {
      return this.activeTab === 'chats' ? this.loadConversations() : this.loadContacts()
    },
    async refreshConversations() {
      if (this.activeTab !== 'chats' || this.loading) return
      await this.loadConversations()
    },
    switchTab(tab) {
      if (tab === this.activeTab) return
      this.activeTab = tab
      this.keyword = ''
      this.loadActiveTab()
    },
    clearSearch() {
      this.keyword = ''
      if (this.activeTab === 'contacts') this.loadContacts()
    },
    openChat(item) {
      const name = encodeURIComponent(item.name || item.username || '同学')
      const avatar = encodeURIComponent(item.avatar || '')
      uni.navigateTo({ url: `/pages/chat/chat?peerId=${item.peerId}&name=${name}&avatar=${avatar}` })
    },
    formatListTime(value) {
      if (!value) return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      const now = new Date()
      const sameDay = date.getFullYear() === now.getFullYear()
        && date.getMonth() === now.getMonth()
        && date.getDate() === now.getDate()
      return sameDay
        ? `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
        : `${date.getMonth() + 1}/${date.getDate()}`
    }
  }
}
</script>

<style scoped>
.messages-page {
  width: 100%;
  max-width: 960rpx;
  min-height: 100vh;
  margin: 0 auto;
  padding-bottom: calc(44rpx + env(safe-area-inset-bottom));
  background:
    radial-gradient(circle at 12% 8%, rgba(255, 255, 255, .55), transparent 34%),
    #f5f3f2;
}

.messages-hero {
  padding: calc(24rpx + env(safe-area-inset-top)) 34rpx 34rpx;
  color: #fff;
  background:
    radial-gradient(circle at 88% -18%, rgba(255, 255, 255, .22), transparent 38%),
    linear-gradient(135deg, #ef4136 0%, #dc241f 54%, #bf1713 100%);
  border-radius: 0 0 36rpx 36rpx;
  box-shadow: 0 14rpx 44rpx rgba(191, 23, 19, .2);
}

.hero-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.hero-kicker {
  color: rgba(255, 255, 255, .72);
  font-size: 18rpx;
  font-weight: 700;
  letter-spacing: 3rpx;
}

.hero-mark {
  color: #ffe27a;
  font-size: 34rpx;
}

.hero-title {
  margin-top: 20rpx;
  display: block;
  font-size: 48rpx;
  font-weight: 800;
}

.hero-subtitle {
  margin-top: 10rpx;
  display: block;
  color: rgba(255, 255, 255, .82);
  font-size: 23rpx;
}

.hero-summary {
  height: 66rpx;
  margin-top: 26rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid rgba(255, 255, 255, .2);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, .13);
  font-size: 22rpx;
}

.summary-dot {
  width: 12rpx;
  height: 12rpx;
  margin-right: 12rpx;
  border-radius: 50%;
  background: #ffe27a;
}

.summary-arrow {
  margin-left: auto;
  color: rgba(255, 255, 255, .7);
  font-size: 34rpx;
}

.messages-content {
  padding: 30rpx 26rpx 0;
}

.section-heading {
  margin: 0 4rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-heading > view {
  display: flex;
  flex-direction: column;
}

.section-title {
  color: #2c2422;
  font-size: 30rpx;
  font-weight: 800;
}

.section-caption {
  margin-top: 6rpx;
  color: #9a8f8b;
  font-size: 20rpx;
}

.refresh-action {
  padding: 10rpx 0 10rpx 18rpx;
  color: #d72c24;
  font-size: 22rpx;
}

.search-card {
  height: 76rpx;
  padding: 0 22rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid #f1eae7;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 8rpx 28rpx rgba(63, 35, 25, .055);
}

.search-icon {
  margin-right: 14rpx;
  color: #b7ada9;
  font-size: 37rpx;
}

.search-input {
  height: 72rpx;
  flex: 1;
  color: #2c2422;
  font-size: 23rpx;
}

.clear-search {
  width: 38rpx;
  color: #a79d99;
  font-size: 34rpx;
  text-align: center;
}

.message-tabs {
  height: 76rpx;
  margin-top: 12rpx;
  display: flex;
  align-items: stretch;
  border-bottom: 1rpx solid #ece5e2;
}

.message-tab {
  min-width: 124rpx;
  margin-right: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: #9a8f8b;
  font-size: 23rpx;
}

.tab-active {
  color: #e02e24;
  font-weight: 800;
}

.tab-active::after {
  height: 5rpx;
  position: absolute;
  right: 28rpx;
  bottom: -1rpx;
  left: 28rpx;
  border-radius: 4rpx 4rpx 0 0;
  background: #e02e24;
  content: '';
}

.tab-count {
  min-width: 30rpx;
  height: 30rpx;
  margin-left: 8rpx;
  padding: 0 8rpx;
  border-radius: 20rpx;
  color: #fff;
  background: #e02e24;
  font-size: 17rpx;
  line-height: 30rpx;
  text-align: center;
}

.conversation-list {
  padding-top: 14rpx;
}

.conversation-card {
  min-height: 116rpx;
  margin-bottom: 14rpx;
  padding: 20rpx 18rpx;
  display: flex;
  align-items: center;
  border: 1rpx solid #f1eae7;
  border-radius: 18rpx;
  background: #fff;
  box-shadow: 0 6rpx 22rpx rgba(63, 35, 25, .045);
}

.avatar-wrap {
  width: 76rpx;
  height: 76rpx;
  margin-right: 18rpx;
  position: relative;
  flex: 0 0 auto;
}

.conversation-avatar {
  width: 76rpx;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.avatar-placeholder {
  color: #bd3029;
  background: linear-gradient(145deg, #fff0ef, #ffd8cf);
  font-size: 30rpx;
  font-weight: 700;
}

.avatar-unread {
  width: 17rpx;
  height: 17rpx;
  position: absolute;
  top: 0;
  right: -1rpx;
  border: 3rpx solid #fff;
  border-radius: 50%;
  background: #e02e24;
}

.conversation-copy {
  min-width: 0;
  flex: 1;
}

.conversation-topline,
.conversation-bottomline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.conversation-name {
  overflow: hidden;
  color: #2c2422;
  font-size: 25rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-time {
  flex: 0 0 auto;
  color: #b7ada9;
  font-size: 18rpx;
}

.conversation-bottomline {
  margin-top: 12rpx;
}

.conversation-preview {
  overflow: hidden;
  flex: 1;
  color: #9a8f8b;
  font-size: 20rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-badge {
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 8rpx;
  border-radius: 18rpx;
  color: #fff;
  background: #e02e24;
  font-size: 17rpx;
  line-height: 30rpx;
  text-align: center;
}

.contact-arrow {
  color: #c2b8b4;
  font-size: 34rpx;
}

.state-card {
  min-height: 300rpx;
  margin-top: 20rpx;
  padding: 36rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1rpx solid #f1eae7;
  border-radius: 20rpx;
  background: #fff;
  text-align: center;
}

.state-icon {
  color: #e02e24;
  font-size: 46rpx;
  font-weight: 700;
}

.state-title {
  margin-top: 12rpx;
  color: #4a403d;
  font-size: 24rpx;
  font-weight: 700;
}

.state-caption {
  margin-top: 8rpx;
  color: #a79d99;
  font-size: 20rpx;
}

.retry-button {
  margin: 18rpx 0 0;
  padding: 0 26rpx;
  border-radius: 999rpx;
  color: #fff;
  background: #e02e24;
  font-size: 21rpx;
  line-height: 58rpx;
}

.retry-button::after {
  border: none;
}

.safety-note {
  padding: 30rpx 0 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #a79d99;
  font-size: 19rpx;
}

.safety-icon {
  width: 28rpx;
  height: 28rpx;
  margin-right: 8rpx;
  border-radius: 50%;
  color: #fff;
  background: #83b08b;
  font-size: 17rpx;
  line-height: 28rpx;
  text-align: center;
}
</style>
