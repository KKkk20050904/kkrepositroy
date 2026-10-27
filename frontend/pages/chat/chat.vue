<template>
  <view class="chat-page">
    <view class="chat-heading">
      <view class="peer-avatar">{{ peerName.slice(0, 1) }}</view>
      <view class="peer-info">
        <text class="peer-name">{{ peerName }}</text>
        <text class="peer-status">校园私信 · 请友好沟通</text>
      </view>
      <text class="refresh-button" @click="loadMessages">刷新</text>
    </view>

    <view v-if="loadError" class="load-state">
      <text>消息加载失败，请检查网络后重试</text>
      <button class="retry-button" @click="loadMessages">重新加载</button>
    </view>
    <scroll-view
      v-else
      class="message-list"
      scroll-y
      :scroll-into-view="scrollTarget"
      :scroll-with-animation="true"
    >
      <view v-if="loading && messages.length === 0" class="empty-state">正在加载消息…</view>
      <view v-else-if="messages.length === 0" class="empty-state">
        <text class="empty-icon">✉</text>
        <text>还没有聊天记录，打个招呼吧</text>
      </view>
      <view
        v-for="message in messages"
        :id="`message-${message.id}`"
        :key="message.id"
        class="message-row"
        :class="{ 'message-mine': message.senderId === currentUserId }"
      >
        <view v-if="message.senderId !== currentUserId" class="message-avatar">{{ peerName.slice(0, 1) }}</view>
        <view class="message-body">
          <text class="message-bubble">{{ message.content }}</text>
          <text class="message-time">{{ formatTime(message.createdAt) }}</text>
        </view>
        <view v-if="message.senderId === currentUserId" class="message-avatar my-avatar">我</view>
      </view>
      <view v-if="syncError" class="sync-error" @click="retrySync">消息同步暂停，点此重试</view>
      <view id="message-bottom" class="list-bottom"></view>
    </scroll-view>

    <view class="composer">
      <view v-if="showEmojiPanel" class="emoji-panel">
        <text v-for="emoji in emojis" :key="emoji" class="emoji-item" @click="appendEmoji(emoji)">{{ emoji }}</text>
        <text v-for="face in kaomojis" :key="face" class="kaomoji-item" @click="appendEmoji(face)">{{ face }}</text>
        <text v-for="symbol in symbols" :key="symbol" class="symbol-item" @click="appendEmoji(symbol)">{{ symbol }}</text>
        <view
          v-for="sticker in stickers"
          :key="sticker.label"
          class="sticker-item"
          @click="appendEmoji(`${sticker.emoji} ${sticker.label}`)"
        >
          <text class="sticker-emoji">{{ sticker.emoji }}</text>
          <text class="sticker-label">{{ sticker.label }}</text>
        </view>
      </view>
      <view class="composer-tools">
        <text class="tool-button" @click="showEmojiPanel = !showEmojiPanel">☺</text>
        <text class="tool-label" @click="showEmojiPanel = !showEmojiPanel">表情 / 颜文字 / 符号</text>
        <text class="tool-hint">文明交流，注意交易安全</text>
      </view>
      <textarea
        v-model="draft"
        class="message-input"
        placeholder="输入消息…"
        maxlength="2000"
        auto-height
        :show-confirm-bar="false"
        @confirm="submitMessage"
      />
      <view class="composer-bottom">
        <text class="char-count">{{ draft.length }}/2000</text>
        <button class="send-button" :disabled="sending || !draft.trim()" @click="submitMessage">
          {{ sending ? '发送中…' : '发送' }}
        </button>
      </view>
      <text v-if="sendError" class="send-error">{{ sendError }}</text>
    </view>
  </view>
</template>

<script>
import { getMessages, sendMessage } from '../../api/message.js'
import { getUser } from '../../common/request.js'

const POLL_INTERVAL = 5000

export default {
  data() {
    return {
      peerId: 0,
      peerName: '同学',
      currentUserId: 0,
      draft: '',
      messages: [],
      emojis: ['😀', '🥰', '😂', '😊', '😍', '👍', '❤️', '🎉', '🙏', '✨', '🤔', '🌷'],
      kaomojis: ['(๑˃̵ᴗ˂̵)و', 'ヾ(≧▽≦*)o', '(｡･ω･｡)ﾉ♡', '(ง •̀_•́)ง'],
      symbols: ['♡', '☆', '♪', '→', '✓', '…', '✿', 'ღ', '∞', '☀', '✔', '❀'],
      stickers: [
        { emoji: '🥰', label: '超喜欢' },
        { emoji: '🐱', label: '收到啦' },
        { emoji: '🎉', label: '太棒啦' },
        { emoji: '🙏', label: '谢谢你' }
      ],
      showEmojiPanel: false,
      loading: true,
      loadError: false,
      syncError: false,
      sending: false,
      sendError: '',
      scrollTarget: 'message-bottom',
      pollTimer: null,
      pollInFlight: false
    }
  },
  onLoad(options) {
    const peerId = Number(options.peerId)
    if (!Number.isSafeInteger(peerId) || peerId < 1) {
      this.loadError = true
      this.loading = false
      uni.showToast({ title: '聊天对象无效', icon: 'none' })
      return
    }
    this.peerId = peerId
    this.peerName = String(options.name || '同学').slice(0, 30)
    const user = getUser()
    this.currentUserId = Number(user && user.id) || 0
    uni.setNavigationBarTitle({ title: this.peerName })
    this.loadMessages()
  },
  onShow() {
    if (this.peerId && !this.pollTimer) {
      this.pollTimer = setInterval(this.pollMessages, POLL_INTERVAL)
    }
  },
  onHide() {
    this.stopPolling()
  },
  onUnload() {
    this.stopPolling()
  },
  onPullDownRefresh() {
    this.loadMessages().finally(() => uni.stopPullDownRefresh())
  },
  methods: {
    stopPolling() {
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
    },
    async loadMessages() {
      if (!this.peerId) return
      this.loading = true
      this.loadError = false
      try {
        const data = await getMessages(this.peerId)
        this.messages = data.list
        this.updateScrollTarget()
      } catch (error) {
        this.loadError = true
      } finally {
        this.loading = false
      }
    },
    async pollMessages() {
      if (this.pollInFlight || this.syncError || !this.peerId) return
      this.pollInFlight = true
      try {
        const latestId = this.messages.length
          ? Math.max(...this.messages.map((message) => Number(message.id)))
          : 0
        const data = await getMessages(this.peerId, latestId)
        this.loadError = false
        if (data.list.length) {
          this.appendMessages(data.list)
          this.updateScrollTarget()
        }
      } catch (error) {
        this.syncError = true
        this.stopPolling()
      } finally {
        this.pollInFlight = false
      }
    },
    retrySync() {
      this.syncError = false
      this.pollMessages()
      if (!this.pollTimer) this.pollTimer = setInterval(this.pollMessages, POLL_INTERVAL)
    },
    appendMessages(incoming) {
      const knownIds = new Set(this.messages.map((message) => String(message.id)))
      const newMessages = incoming.filter((message) => !knownIds.has(String(message.id)))
      if (newMessages.length) {
        this.messages = this.messages.concat(newMessages)
      }
    },
    updateScrollTarget() {
      const lastMessage = this.messages[this.messages.length - 1]
      this.scrollTarget = lastMessage ? `message-${lastMessage.id}` : 'message-bottom'
    },
    appendEmoji(value) {
      this.draft += value
    },
    formatTime(value) {
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    },
    async submitMessage() {
      const content = this.draft.trim()
      if (!content || this.sending || !this.peerId) return
      this.sending = true
      this.sendError = ''
      try {
        const message = await sendMessage(this.peerId, content)
        this.appendMessages([message])
        this.draft = ''
        this.showEmojiPanel = false
        this.updateScrollTarget()
      } catch (error) {
        this.sendError = '发送失败，请检查网络后重试'
      } finally {
        this.sending = false
      }
    }
  }
}
</script>

<style scoped>
.chat-page {
  min-height: 100vh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
}

.chat-heading {
  height: 112rpx;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  background: #fff;
  border-bottom: 1rpx solid #e9ebef;
}

.peer-avatar,
.message-avatar {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #a45e46;
  background: #f7ddcf;
  font-size: 30rpx;
  font-weight: 600;
}

.peer-info {
  margin-left: 18rpx;
  display: flex;
  flex: 1;
  flex-direction: column;
}

.peer-name {
  color: #30343b;
  font-size: 30rpx;
  font-weight: 600;
}

.peer-status {
  margin-top: 8rpx;
  color: #a0a4ad;
  font-size: 22rpx;
}

.refresh-button {
  padding: 12rpx 4rpx 12rpx 20rpx;
  color: #477ed1;
  font-size: 25rpx;
}

.message-list {
  flex: 1;
  min-height: 0;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
}

.empty-state,
.load-state {
  min-height: 220rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18rpx;
  color: #999eaa;
  font-size: 26rpx;
}

.empty-icon {
  color: #bdc5d2;
  font-size: 58rpx;
}

.retry-button {
  margin: 0;
  padding: 0 24rpx;
  color: #477ed1;
  background: #edf3ff;
  font-size: 24rpx;
  line-height: 62rpx;
}

.message-row {
  margin-bottom: 28rpx;
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
}

.message-mine {
  justify-content: flex-end;
}

.message-avatar {
  width: 62rpx;
  height: 62rpx;
  flex: 0 0 auto;
  font-size: 24rpx;
}

.my-avatar {
  color: #fff;
  background: #6d91d2;
}

.message-body {
  max-width: 76%;
  display: flex;
  flex-direction: column;
}

.message-bubble {
  padding: 18rpx 22rpx;
  border-radius: 8rpx 22rpx 22rpx 22rpx;
  color: #353941;
  background: #fff;
  font-size: 28rpx;
  line-height: 1.55;
  word-break: break-word;
}

.message-mine .message-bubble {
  border-radius: 22rpx 8rpx 22rpx 22rpx;
  background: #dceaff;
}

.message-time {
  margin: 8rpx 6rpx 0;
  color: #a7aab2;
  font-size: 20rpx;
}

.message-mine .message-time {
  text-align: right;
}

.sync-error {
  padding: 12rpx 0;
  color: #d5765e;
  font-size: 22rpx;
  text-align: center;
}

.list-bottom {
  height: 1rpx;
}

.composer {
  flex: 0 0 auto;
  padding: 12rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #e7e9ed;
  background: #fff;
}

.emoji-panel {
  max-height: 230rpx;
  margin: 0 -4rpx 12rpx;
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  overflow-y: auto;
}

.emoji-item {
  width: 12.5%;
  height: 60rpx;
  color: #454953;
  font-size: 36rpx;
  line-height: 60rpx;
  text-align: center;
}

.kaomoji-item {
  margin: 4rpx;
  padding: 8rpx 12rpx;
  border-radius: 10rpx;
  color: #626875;
  background: #f5f6f9;
  font-size: 20rpx;
}

.symbol-item {
  width: 12.5%;
  height: 60rpx;
  color: #64708a;
  font-size: 34rpx;
  line-height: 60rpx;
  text-align: center;
}

.sticker-item {
  width: 23%;
  min-height: 94rpx;
  margin: 4rpx 1%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: #fff7f2;
}

.sticker-emoji {
  font-size: 38rpx;
}

.sticker-label {
  margin-top: 4rpx;
  color: #77727a;
  font-size: 18rpx;
}

.composer-tools {
  height: 54rpx;
  display: flex;
  align-items: center;
}

.tool-button {
  color: #707783;
  font-size: 38rpx;
  line-height: 1;
}

.tool-label {
  margin-left: 10rpx;
  color: #727985;
  font-size: 22rpx;
}

.tool-hint {
  margin-left: auto;
  color: #b0b4bc;
  font-size: 19rpx;
}

.message-input {
  width: 100%;
  min-height: 90rpx;
  max-height: 220rpx;
  padding: 16rpx 18rpx;
  box-sizing: border-box;
  border-radius: 12rpx;
  color: #333740;
  background: #f6f7f9;
  font-size: 27rpx;
  line-height: 1.5;
}

.composer-bottom {
  margin-top: 12rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18rpx;
}

.char-count {
  color: #afb2b9;
  font-size: 20rpx;
}

.send-button {
  margin: 0;
  padding: 0 36rpx;
  border-radius: 10rpx;
  color: #fff;
  background: #3978d4;
  font-size: 26rpx;
  line-height: 66rpx;
}

.send-button[disabled] {
  color: #fff;
  background: #a9bfdf;
}

.send-button::after {
  border: none;
}

.send-error {
  margin-top: 8rpx;
  display: block;
  color: #d76859;
  font-size: 22rpx;
  text-align: right;
}
</style>
