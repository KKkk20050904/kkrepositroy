import { BASE_URL } from './request.js'

export const CHAT_PREFILL = '你好，这个商品还在吗？'

/**
 * 把后端返回的相对图片地址补全为可访问地址。
 * 商品详情接口在 main 分支返回的是绝对地址，本地整合分支返回相对地址，这里统一兼容。
 */
export function resolveImageUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * 统一生成私信页跳转地址。
 * peerId 必填；goods 传入时会在聊天页顶部展示「正在咨询」商品卡片。
 */
export function buildChatUrl({ peerId, name, avatar, goods, prefill = CHAT_PREFILL } = {}) {
  let url = `/pages/chat/chat?peerId=${peerId}` +
    `&name=${encodeURIComponent(name || '卖家')}` +
    `&avatar=${encodeURIComponent(avatar || '')}` +
    `&prefill=${encodeURIComponent(prefill)}`

  if (goods && goods.id) {
    url += `&goodsId=${goods.id}` +
      `&goodsTitle=${encodeURIComponent(goods.title || '')}` +
      `&goodsPrice=${encodeURIComponent(goods.price === undefined || goods.price === null ? '' : goods.price)}` +
      `&goodsImage=${encodeURIComponent(goods.image || '')}`
  }

  return url
}
