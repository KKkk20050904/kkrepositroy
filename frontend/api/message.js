import { request } from '../common/request.js'

export function getConversations() {
  return request({
    url: '/api/msg/conversations',
    method: 'GET'
  })
}

export function getContacts(keyword = '') {
  return request({
    url: '/api/msg/contacts',
    method: 'GET',
    data: { keyword }
  })
}

export function getMessages(peerId, afterId = 0) {
  return request({
    url: '/api/msg',
    method: 'GET',
    data: { peerId, afterId }
  })
}

export function sendMessage(receiverId, content) {
  return request({
    url: '/api/msg',
    method: 'POST',
    data: { receiverId, content }
  })
}
