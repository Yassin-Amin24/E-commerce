import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { conversationsApi } from '../api/conversations'
import { Conversation, Message, MessageStatus } from '../types'
import { useAuthStore } from '../store/authStore'

export default function Chats() {
  const navigate = useNavigate()
  const { conversationId } = useParams<{ conversationId: string }>()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  )

  const fetchConversations = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoadingConversations(true)
          setError(null)
        }
        const data = await conversationsApi.list()
        setConversations(data)
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Failed to load conversations')
        }
      } finally {
        if (!silent) {
          setLoadingConversations(false)
        }
      }
    },
    []
  )

  const fetchMessages = useCallback(
    async (id: string, silent = false) => {
      try {
        if (!silent) {
          setLoadingMessages(true)
          setError(null)
        }
        const data = await conversationsApi.messages(id)
        setMessages(data)
        await Promise.all([
          conversationsApi.markDelivered(id),
          conversationsApi.markRead(id),
        ])
      } catch (err) {
        if (!silent) {
          setError(err instanceof Error ? err.message : 'Failed to load messages')
        }
      } finally {
        if (!silent) {
          setLoadingMessages(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(true)
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }
    fetchMessages(conversationId)
    const interval = setInterval(() => {
      fetchMessages(conversationId, true)
    }, 5000)
    return () => clearInterval(interval)
  }, [conversationId, fetchMessages])

  useEffect(() => {
    if (!conversationId && conversations.length > 0) {
      navigate(`/chats/${conversations[0].id}`, { replace: true })
    }
  }, [conversationId, conversations, navigate])

  const handleSelectConversation = (id: string) => {
    if (id !== conversationId) {
      navigate(`/chats/${id}`)
    }
  }

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    if (!conversationId || messageInput.trim().length === 0) return

    try {
      await conversationsApi.send(conversationId, messageInput.trim())
      setMessageInput('')
      await fetchMessages(conversationId)
      await fetchConversations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const handleDeleteConversation = async (id: string) => {
    const confirmed = window.confirm('Delete this chat? This will remove all messages.')
    if (!confirmed) return
    try {
      await conversationsApi.delete(id)
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (conversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          navigate(`/chats/${remaining[0].id}`, { replace: true })
        } else {
          navigate('/chats', { replace: true })
          setMessages([])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chat')
    }
  }

  const renderStatusIcon = (status: MessageStatus) => {
    if (!conversationId) return null
    if (status === 'sent') return '✓'
    if (status === 'delivered') return '✓✓'
    if (status === 'read') return <span className="text-blue-500">✓✓</span>
    return null
  }

  const counterpart = useMemo(() => {
    if (!selectedConversation || !user) return null
    return selectedConversation.buyer.id === user.id
      ? selectedConversation.seller
      : selectedConversation.buyer
  }, [selectedConversation, user])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Chats</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b px-4 py-3 font-semibold">Conversations</div>
          {loadingConversations ? (
            <p className="p-4 text-sm text-gray-500">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No conversations yet.</p>
          ) : (
            <ul>
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation.id)}
                  className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 ${
                    conversation.id === conversationId ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-semibold text-sm">{conversation.product.name}</p>
                      <p className="text-xs text-gray-500">{conversation.product.location}</p>
                      {conversation.last_message && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                          {conversation.last_message.content}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteConversation(conversation.id)
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-md flex flex-col">
          {conversationId && selectedConversation ? (
            <>
              <div className="border-b px-4 py-3">
                <p className="font-semibold">{selectedConversation.product.name}</p>
                <p className="text-sm text-gray-500">
                  Chat with {counterpart?.full_name} · {selectedConversation.product.location}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {loadingMessages ? (
                  <p className="text-sm text-gray-500">Loading messages...</p>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-gray-500">Start the conversation!</p>
                ) : (
                  messages.map((message) => {
                    const isMine = user?.id === message.sender_id
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-md rounded-lg px-4 py-2 ${
                            isMine ? 'bg-blue-500 text-white' : 'bg-gray-100'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div className="text-xs text-right mt-1 flex items-center gap-1 justify-end">
                            <span>{new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMine && renderStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
              <form onSubmit={handleSendMessage} className="border-t px-4 py-3 flex gap-3">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 border rounded-md px-4 py-2"
                  placeholder="Write a message..."
                />
                <button
                  type="submit"
                  disabled={messageInput.trim().length === 0}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-60"
                >
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a conversation to start chatting.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
