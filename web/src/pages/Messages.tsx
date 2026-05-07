import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type MutableRefObject } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { getJson, getWebSocketBase, postJson } from '../lib/api'
import { playMessagePing } from '../lib/notificationSound'
import { useAutoClearMessage } from '../lib/useAutoClearMessage'
import '../styles/Messages.css'

const log = (msg: string) => console.debug(`[Messages] ${msg}`)

type StoredUser = {
  email: string
  firstName?: string
  lastName?: string
}

type Participant = {
  userid: string
  first_name: string
  last_name: string
  email: string
  campus?: string
  display_name: string
  initials: string
}

type ConversationSummary = {
  id: string
  participant: Participant
  preview: string
  last_message_at: string
  time_label: string
  unread_count: number
  has_unread: boolean
  last_sender_email?: string | null
}

type ChatMessage = {
  id: string
  body: string
  is_read: boolean
  created_at: string
  is_current_user: boolean
  sender: Participant
}

type ThreadPayload = {
  conversation: {
    id: string
    participant: Participant
    created_at: string
    other_user: Participant
  }
  messages: ChatMessage[]
}

const Messages = () => {
  const navigate = useNavigate()
  const storedUser = useMemo(() => {
    const raw = localStorage.getItem('roomsphereUser')
    if (!raw) return null

    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  }, [])

  const [currentUser, setCurrentUser] = useState<StoredUser | null>(storedUser)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState('')
  const [thread, setThread] = useState<ThreadPayload | null>(null)
  const [contactSearch, setContactSearch] = useState('')
  const [threadSearch, setThreadSearch] = useState('')
  const [showThreadSearch, setShowThreadSearch] = useState(false)
  const [messageBody, setMessageBody] = useState('')
  const [sidebarLoading, setSidebarLoading] = useState(false)
  const [threadLoading, setThreadLoading] = useState(false)
  const [error, setError] = useState('')
  const [newThreadEmail, setNewThreadEmail] = useState('')
  const [showComposer, setShowComposer] = useState(false)
  const [composerMessage, setComposerMessage] = useState('')
  const composerRef = useRef<HTMLTextAreaElement | null>(null)
  const threadEndRef = useRef<HTMLDivElement | null>(null)
  const inboxSocketRef = useRef<WebSocket | null>(null)
  const threadSocketRef = useRef<WebSocket | null>(null)
  const websocketBase = useMemo(() => getWebSocketBase(), [])
  const clearError = useCallback(() => setError(''), [])

  const location = useLocation()

  useAutoClearMessage(error, clearError)

  const currentEmail = currentUser?.email ?? storedUser?.email ?? ''

  const upsertConversation = (nextConversation: ConversationSummary) => {
    setConversations((previous) => {
      const others = previous.filter((conversation) => conversation.id !== nextConversation.id)
      const next = [nextConversation, ...others]
      next.sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
      return next
    })
  }

  const closeSocket = (socketRef: MutableRefObject<WebSocket | null>) => {
    if (socketRef.current) {
      socketRef.current.onopen = null
      socketRef.current.onmessage = null
      socketRef.current.onerror = null
      socketRef.current.onclose = null
      socketRef.current.close()
      socketRef.current = null
    }
  }

  useEffect(() => {
    if (!storedUser) {
      navigate('/login')
      return
    }

    setCurrentUser(storedUser)
  }, [navigate, storedUser])

  const loadConversations = async () => {
    if (!currentEmail) return
    setSidebarLoading(true)

    try {
      const result = await getJson('/messages/conversations/', { email: currentEmail })
      const nextConversations = Array.isArray(result.conversations)
        ? (result.conversations as ConversationSummary[])
        : []

      setConversations(nextConversations)
      setError('')

      if (!selectedConversationId && nextConversations.length > 0) {
        setSelectedConversationId(nextConversations[0].id)
      }

      if (selectedConversationId && !nextConversations.some((item) => item.id === selectedConversationId)) {
        setSelectedConversationId(nextConversations[0]?.id ?? '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations')
    } finally {
      setSidebarLoading(false)
    }
  }

  const loadThread = async (conversationId: string) => {
    if (!currentEmail || !conversationId) return
    setThreadLoading(true)

    try {
      const result = await getJson(`/messages/conversations/${conversationId}/`, { email: currentEmail })
      setThread(result as ThreadPayload)
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversation')
      setThread(null)
    } finally {
      setThreadLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
    // If navigation provided state to open composer with prefilled data, apply it
    try {
      const state = (location && (location as any).state) || {}
      if (state.openComposer) {
        setShowComposer(true)
        if (state.recipientEmail) setNewThreadEmail(state.recipientEmail)
        if (state.prefillMessage) setComposerMessage(state.prefillMessage)
      }
    } catch {
      // ignore
    }
  }, [currentEmail])

  useEffect(() => {
    if (selectedConversationId) {
      loadThread(selectedConversationId)
    }
  }, [selectedConversationId])

  useEffect(() => {
    if (!currentEmail) {
      return
    }

    closeSocket(inboxSocketRef)
    log('Inbox WebSocket connecting')

    const socket = new WebSocket(`${websocketBase}/ws/messages/inbox/?email=${encodeURIComponent(currentEmail)}`)
    inboxSocketRef.current = socket

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          conversations?: ConversationSummary[]
          conversation?: ConversationSummary
          message?: string
        }

        if (payload.type === 'inbox.snapshot' && Array.isArray(payload.conversations)) {
          log(`Inbox snapshot: ${payload.conversations.length} conversations`)
          setConversations(payload.conversations)
          setSelectedConversationId((previous) => previous || payload.conversations?.[0]?.id || '')
        }

        if (payload.type === 'inbox.updated' && payload.conversation) {
          log(`Inbox updated: ${payload.conversation.participant.display_name}`)
          upsertConversation(payload.conversation)
        }

        if (payload.type === 'error' && payload.message) {
          setError(payload.message)
        }
      } catch {
        setError('Failed to read inbox updates')
      }
    }

    socket.onerror = () => {
      setError('Inbox websocket disconnected')
    }

    return () => {
      closeSocket(inboxSocketRef)
    }
  }, [currentEmail, websocketBase])

  useEffect(() => {
    if (!currentEmail || !selectedConversationId) {
      return
    }

    closeSocket(threadSocketRef)
    log('Conversation WebSocket connecting')
    setThreadLoading(true)

    const socket = new WebSocket(
      `${websocketBase}/ws/messages/conversations/${selectedConversationId}/?email=${encodeURIComponent(currentEmail)}`,
    )
    threadSocketRef.current = socket

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string
          thread?: ThreadPayload
          message?: ChatMessage | string
        }

        if (payload.type === 'thread.snapshot' && payload.thread) {
          log(`Thread loaded: ${payload.thread.messages.length} messages`)
          setThread(payload.thread)
          setThreadLoading(false)
        }

        if (payload.type === 'message.created' && payload.message && typeof payload.message !== 'string') {
          const nextMessage = payload.message as ChatMessage
          log(`Message received${nextMessage.is_current_user ? ' (own)' : ''}`)

          setThread((previous) => {
            if (!previous) {
              return previous
            }

            if (!nextMessage.is_current_user) {
              void playMessagePing()
            }

            return {
              ...previous,
              messages: [...previous.messages, nextMessage],
            }
          })
        }

        if (payload.type === 'error' && typeof payload.message === 'string') {
          setError(payload.message)
        }
      } catch {
        setError('Failed to read conversation updates')
      }
    }

    socket.onerror = () => {
      setError('Conversation websocket disconnected')
    }

    return () => {
      closeSocket(threadSocketRef)
      setThreadLoading(false)
    }
  }, [currentEmail, selectedConversationId, websocketBase])

  useEffect(() => {
    if (composerRef.current && thread) {
      composerRef.current.style.height = 'auto'
      composerRef.current.style.height = `${Math.min(composerRef.current.scrollHeight, 132)}px`
    }
  }, [messageBody, thread])

  useEffect(() => {
    if (!thread || !threadEndRef.current) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      threadEndRef.current?.scrollIntoView({ block: 'end' })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [selectedConversationId, thread?.conversation.id, thread?.messages.length])

  const filteredConversations = useMemo(() => {
    const lowered = contactSearch.trim().toLowerCase()
    if (!lowered) return conversations

    return conversations.filter((conversation) => {
      const { participant, preview } = conversation
      return [
        participant.display_name,
        participant.email,
        participant.campus ?? '',
        preview,
      ]
        .join(' ')
        .toLowerCase()
        .includes(lowered)
    })
  }, [conversations, contactSearch])

  const filteredMessages = useMemo(() => {
    if (!thread) return []

    const lowered = threadSearch.trim().toLowerCase()
    if (!lowered) return thread.messages

    return thread.messages.filter((message) => {
      return [message.body, message.sender.display_name, message.sender.email]
        .join(' ')
        .toLowerCase()
        .includes(lowered)
    })
  }, [thread, threadSearch])

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId) ?? conversations[0] ?? null,
    [conversations, selectedConversationId],
  )

  const handleSendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!thread?.conversation.id || !messageBody.trim() || !currentEmail) return

    try {
      const socket = threadSocketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error('Conversation websocket is not connected')
      }

      log('Sending message')
      socket.send(
        JSON.stringify({
          action: 'send_message',
          body: messageBody.trim(),
        }),
      )
      setMessageBody('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const handleCreateConversation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newThreadEmail.trim() || !currentEmail) return

    try {
      const result = await postJson('/messages/conversations/', {
        email: currentEmail,
        other_email: newThreadEmail.trim(),
      })
      const conversation = result.conversation as { id: string }
      // If the composer had an initial message, send it after creating the conversation
      if (composerMessage && composerMessage.trim()) {
        try {
          await postJson(`/messages/conversations/${conversation.id}/`, {
            email: currentEmail,
            body: composerMessage.trim(),
          })
        } catch (err) {
          // ignore send errors here, show in UI
          setError(err instanceof Error ? err.message : 'Failed to send initial message')
        }
      }

      setShowComposer(false)
      setComposerMessage('')
      setNewThreadEmail('')
      setSelectedConversationId(conversation.id)
      await loadConversations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation')
    }
  }

  const currentUserLabel = currentUser?.firstName || currentUser?.lastName
    ? `${currentUser?.firstName ?? ''} ${currentUser?.lastName ?? ''}`.trim()
    : currentEmail.split('@')[0]

  if (!storedUser) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="page messages-page">
      <header className="messages-topbar">
        <div className="messages-topbar-inner container">
          <Link to="/" className="brand messages-brand">
            <span className="brand-mark" aria-hidden="true">
              RS
            </span>
            <span className="brand-text">
              <span className="brand-name">Roomsphere</span>
              <span className="brand-sub">Direct messages</span>
            </span>
          </Link>

          <div className="messages-topbar-actions">
            <Link to="/" className="messages-link">
              Home
            </Link>
            <button className="messages-new-button" type="button" onClick={() => setShowComposer(true)} aria-label="Start new conversation">
              New message
            </button>
          </div>
        </div>
      </header>

      <main className="messages-layout container">
        <aside className="messages-sidebar">
          <div className="sidebar-header">
            <div>
              <p className="sidebar-eyebrow">Messages</p>
              <h1>Inbox</h1>
            </div>
            <div className="current-user-chip" title={currentEmail} aria-label={`Currently logged in as ${currentEmail}`}>
              <span aria-hidden="true">{currentUserLabel.slice(0, 2).toUpperCase()}</span>
            </div>
          </div>

          <label className="conversation-search" aria-label="Search conversations">
            <svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.5-1.5L21 21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              type="text"
              placeholder="Search conversations"
              value={contactSearch}
              onChange={(event) => setContactSearch(event.target.value)}
            />
          </label>

          <div className="conversation-list">
            {sidebarLoading ? <p className="sidebar-note">Loading conversations...</p> : null}

            {!sidebarLoading && filteredConversations.length === 0 ? (
              <div className="empty-sidebar-state">
                <p>No conversations yet.</p>
                <button className="empty-action" type="button" onClick={() => setShowComposer(true)}>
                  Start a chat
                </button>
              </div>
            ) : null}

            {filteredConversations.map((conversation) => {
              const active = conversation.id === selectedConversationId
              const participant = conversation.participant
              return (
                <button
                  key={conversation.id}
                  type="button"
                  className={`conversation-item ${active ? 'active' : ''}`}
                  onClick={() => setSelectedConversationId(conversation.id)}
                  aria-label={`Conversation with ${participant.display_name}, ${conversation.preview}${conversation.has_unread ? ', unread' : ''}`}
                  aria-current={active ? 'true' : 'false'}
                >
                  <div className="conversation-avatar" aria-hidden="true">{participant.initials}</div>
                  <div className="conversation-copy">
                    <div className="conversation-row">
                      <strong>{participant.display_name}</strong>
                      <span aria-label={`Last message ${conversation.time_label}`}>{conversation.time_label}</span>
                    </div>
                    <p className="conversation-subtitle">{participant.campus || participant.email}</p>
                    <p className="conversation-preview">{conversation.preview}</p>
                  </div>
                  {conversation.has_unread ? <span className="conversation-dot" aria-label="Unread message indicator" /> : null}
                </button>
              )
            })}
          </div>
        </aside>

        <section className="messages-panel">
          {thread && selectedConversation ? (
            <>
              <header className="thread-header">
                <div className="thread-participant">
                  <div className="conversation-avatar thread-avatar" aria-hidden="true">{selectedConversation.participant.initials}</div>
                  <div>
                    <h2>{selectedConversation.participant.display_name}</h2>
                    <p aria-label={`${selectedConversation.participant.display_name} campus: ${selectedConversation.participant.campus || selectedConversation.participant.email}`}>{selectedConversation.participant.campus || selectedConversation.participant.email}</p>
                  </div>
                </div>

                <div className="thread-actions">
                  <button
                    type="button"
                    className="thread-icon-button"
                    aria-label={`${showThreadSearch ? 'Hide' : 'Show'} search in thread`}
                    aria-pressed={showThreadSearch}
                    onClick={() => setShowThreadSearch((previous) => !previous)}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                      <path
                        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.5-1.5L21 21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <button type="button" className="thread-icon-button" aria-label="View conversation details">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                      <path
                        d="M5 12h14M12 5v14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </div>
              </header>

              {showThreadSearch ? (
                <div className="thread-search-wrap">
                  <label className="thread-search" aria-label="Search messages in this conversation">
                    <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none">
                      <path
                        d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm5.5-1.5L21 21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search in conversation"
                      value={threadSearch}
                      onChange={(event) => setThreadSearch(event.target.value)}
                    />
                  </label>
                </div>
              ) : null}

              <div className="thread-body">
                {threadLoading ? <p className="sidebar-note">Loading messages...</p> : null}
                {!threadLoading && thread.messages.length === 0 ? (
                  <div className="empty-thread-state">
                    <h3>No messages yet</h3>
                    <p>Send the first message to start the conversation.</p>
                  </div>
                ) : null}

                {!threadLoading && thread.messages.length > 0 && filteredMessages.length === 0 ? (
                  <div className="empty-thread-state">
                    <h3>No matches</h3>
                    <p>Try a different message keyword or sender name.</p>
                  </div>
                ) : null}

                {filteredMessages.map((message) => (
                  <article
                    key={message.id}
                    className={`message-row ${message.is_current_user ? 'message-row-self' : 'message-row-other'}`}
                    aria-label={`Message from ${message.is_current_user ? 'you' : message.sender.display_name} at ${new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}
                  >
                    {!message.is_current_user ? (
                      <div className="message-avatar" aria-hidden="true">{message.sender.initials}</div>
                    ) : null}
                    <div className={`message-bubble ${message.is_current_user ? 'self' : 'other'}`}>
                      <p>{message.body}</p>
                      <span aria-label={`Sent at ${new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                    </div>
                  </article>
                ))}
                <div ref={threadEndRef} />
              </div>

              <form className="composer" onSubmit={handleSendMessage} aria-label="Send message">
                <textarea
                  ref={composerRef}
                  placeholder={`Message ${selectedConversation.participant.display_name}`}
                  value={messageBody}
                  onChange={(event) => setMessageBody(event.target.value)}
                  rows={1}
                  aria-label={`Type your message to ${selectedConversation.participant.display_name}`}
                />
                <button className="composer-send" type="submit" disabled={!messageBody.trim()} aria-label="Send message">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="empty-thread-state large">
              <h2>Select a conversation</h2>
              <p>Choose a thread from the inbox or start a new message.</p>
              <button type="button" className="empty-action" onClick={() => setShowComposer(true)} aria-label="Start a new conversation">
                New message
              </button>
            </div>
          )}
        </section>
      </main>

      {showComposer ? (
        <div className="composer-overlay" role="presentation" onClick={() => setShowComposer(false)}>
          <div className="composer-modal" role="dialog" aria-modal="true" aria-labelledby="composer-dialog-title" onClick={(event) => event.stopPropagation()}>
            <div className="composer-modal-header">
              <div>
                <p className="sidebar-eyebrow">Start new conversation</p>
                <h3 id="composer-dialog-title">Message by email</h3>
              </div>
              <button type="button" className="thread-icon-button" onClick={() => setShowComposer(false)} aria-label="Close dialog">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                  <path
                    d="M6 6l12 12M18 6 6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <form className="composer-form" onSubmit={handleCreateConversation} aria-label="Create new conversation">
              <label className="field">
                <span>Recipient email</span>
                <input
                  type="email"
                  placeholder="student@school.edu"
                  value={newThreadEmail}
                  onChange={(event) => setNewThreadEmail(event.target.value)}
                  autoFocus
                  required
                  aria-label="Recipient email address"
                  aria-describedby="email-help"
                />
                <span id="email-help" className="field-help">Enter the email address of the person you want to message</span>
              </label>
              <label className="field">
                <span>Message</span>
                <textarea
                  placeholder="Write a quick message to the recipient"
                  value={composerMessage}
                  onChange={(event) => setComposerMessage(event.target.value)}
                  rows={6}
                  aria-label="Initial message body"
                />
              </label>
              <div className="composer-modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowComposer(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Open chat
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {error ? <div className="messages-toast">{error}</div> : null}
    </div>
  )
}

export default Messages