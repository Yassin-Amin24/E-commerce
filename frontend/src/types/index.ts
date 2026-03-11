export interface UserSummary {
  id: string
  email: string
  full_name: string
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  location: string
  image_urls: string[]
  created_at: string
  seller: UserSummary
}

export interface ProductListResponse {
  products: Product[]
  total: number
}

export interface ConversationProductSummary {
  id: string
  name: string
  price: number
  location: string
  image_urls: string[]
}

export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string
  content: string
  status: MessageStatus
  sent_at: string
  delivered_at?: string
  read_at?: string
}

export interface Conversation {
  id: string
  product: ConversationProductSummary
  buyer: UserSummary
  seller: UserSummary
  created_at: string
  last_message?: Message
}
