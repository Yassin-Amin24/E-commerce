import { apiClient } from './client'
import { Conversation, Message } from '../types'

export const conversationsApi = {
  start(productId: string) {
    return apiClient.post<Conversation>('/conversations', { product_id: productId })
  },
  list() {
    return apiClient.get<Conversation[]>('/conversations')
  },
  messages(conversationId: string) {
    return apiClient.get<Message[]>(`/conversations/${conversationId}/messages`)
  },
  send(conversationId: string, content: string) {
    return apiClient.post(`/conversations/${conversationId}/messages`, { content })
  },
  markDelivered(conversationId: string) {
    return apiClient.post<{ updated: number }>(`/conversations/${conversationId}/delivered`)
  },
  markRead(conversationId: string) {
    return apiClient.post<{ updated: number }>(`/conversations/${conversationId}/read`)
  },
  delete(conversationId: string) {
    return apiClient.delete(`/conversations/${conversationId}`)
  },
}
