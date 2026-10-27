import { request } from '../common/request.js'

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
