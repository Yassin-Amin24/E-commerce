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
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Messages</h1>
        <p className="text-gray-500 mt-1">Your conversations with buyers and sellers</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-danger px-4 py-3 rounded-xl mb-6 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
        {/* ── Conversation list ─────────────────────── */}
        <div className="card flex flex-col overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <span>Conversations</span>
            {conversations.length > 0 && (
              <span className="badge badge-primary">{conversations.length}</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loadingConversations ? (
              <div className="space-y-0 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-4 py-4 flex gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-700">No messages yet</p>
                <p className="text-xs text-gray-400 mt-1">Contact a seller to start chatting</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isSelected = conversation.id === conversationId
                return (
                  <div
                    key={conversation.id}
                    onClick={() => handleSelectConversation(conversation.id)}
                    className={`group px-4 py-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 border-l-2 border-indigo-500'
                        : 'hover:bg-gray-50 border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Product thumbnail */}
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {conversation.product.image_urls?.[0] ? (
                          <img src={conversation.product.image_urls[0]} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {conversation.product.name}
                          </p>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conversation.id) }}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-danger transition-all p-0.5 rounded"
                            title="Delete conversation"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{conversation.product.location}</p>
                        {conversation.last_message && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{conversation.last_message.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ── Message panel ─────────────────────────── */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden">
          {conversationId && selectedConversation ? (
            <>
              {/* Chat header */}
              <div className="card-header flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {selectedConversation.product.image_urls?.[0] ? (
                    <img src={selectedConversation.product.image_urls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-indigo-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{selectedConversation.product.name}</p>
                  <p className="text-xs text-gray-400">
                    with {counterpart?.full_name} · {selectedConversation.product.location}
                  </p>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  ${selectedConversation.product.price.toFixed(2)}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-slate-50/50">
                {loadingMessages ? (
                  <div className="space-y-3 animate-pulse">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div className={`rounded-2xl px-4 py-2.5 ${i % 2 === 0 ? 'bg-white w-48' : 'bg-indigo-200 w-36'} h-10`} />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500">No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isMine = user?.id === message.sender_id
                    return (
                      <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-sm rounded-2xl px-4 py-2.5 shadow-sm ${
                            isMine
                              ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-md'
                              : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className={`text-xs mt-1 flex items-center gap-1 justify-end ${isMine ? 'text-indigo-200' : 'text-gray-400'}`}>
                            <span>
                              {new Date(message.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMine && renderStatusIcon(message.status)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Message input */}
              <form onSubmit={handleSendMessage} className="border-t border-gray-100 px-4 py-3.5 flex items-center gap-3 bg-white">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 form-control py-2.5"
                  placeholder="Type a message..."
                />
                <button
                  type="submit"
                  disabled={messageInput.trim().length === 0}
                  className="btn-gradient flex-shrink-0 h-10 w-10 p-0 rounded-xl disabled:opacity-40"
                  title="Send"
                >
                  <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/50">
              <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">Select a conversation</p>
              <p className="text-gray-400 text-sm mt-1">Choose a chat from the list to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
