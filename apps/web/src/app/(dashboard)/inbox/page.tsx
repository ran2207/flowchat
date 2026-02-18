'use client'

import { useState, useEffect, useCallback } from 'react'
import { PanelRightOpen, PanelRightClose, UserCog } from 'lucide-react'
import { ConversationList } from '@/components/inbox/conversation-list'
import { MessageThread } from '@/components/inbox/message-thread'
import { ContactSidebar } from '@/components/inbox/contact-sidebar'
import {
  useInboxStore,
  type MessageItem,
} from '@/stores/inbox.store'

interface ConversationDetail {
  id: string
  status: string
  contact: {
    id: string
    firstName: string | null
    lastName: string | null
    email: string | null
    phone: string | null
    avatarUrl: string | null
    platform: string
    platformUserId: string
    customFields: Record<string, unknown>
    isSubscribed: boolean
    lastInteractionAt: string | null
    createdAt: string
  }
  channel: { id: string; platform: string; name: string }
  assignedAgent: { id: string; firstName: string | null; lastName: string | null; avatarUrl: string | null } | null
}

export default function InboxPage() {
  const {
    selectedConversationId,
    filter,
    setConversations,
    setMessages,
    addMessage,
    setLoadingConversations,
    setLoadingMessages,
    setSending,
    updateConversation,
  } = useInboxStore()

  const [showContactSidebar, setShowContactSidebar] = useState(true)
  const [conversationDetail, setConversationDetail] =
    useState<ConversationDetail | null>(null)
  const [contactTags] = useState<
    Array<{ id: string; name: string; color: string | null }>
  >([])

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [filter])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
      loadConversationDetail(selectedConversationId)
    } else {
      setConversationDetail(null)
    }
  }, [selectedConversationId])

  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      // TODO: Wire up to real API
      // const params = new URLSearchParams()
      // if (filter === 'mine') params.set('assignment', 'me')
      // else if (filter === 'unassigned') params.set('assignment', 'unassigned')
      // else if (filter === 'resolved') params.set('status', 'resolved')
      // const data = await apiFetch(`/conversations?${params}`, { token: MOCK_TOKEN })
      // setConversations(data.data)

      // For now, set empty - will be populated by real data
      setConversations([])
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadMessages = async (_conversationId: string) => {
    setLoadingMessages(true)
    try {
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadConversationDetail = async (_conversationId: string) => {
    try {
      setConversationDetail(null)
    } catch {
      setConversationDetail(null)
    }
  }

  const handleSendMessage = useCallback(
    async (text: string, isNote: boolean) => {
      if (!selectedConversationId) return

      setSending(true)
      try {
        // TODO: Wire up to real API
        // const message = await apiFetch(`/conversations/${selectedConversationId}/messages`, {
        //   method: 'POST',
        //   token: MOCK_TOKEN,
        //   body: JSON.stringify({ text, isNote }),
        // })
        // addMessage(message)

        // Optimistic update
        const optimisticMessage: MessageItem = {
          id: `temp-${Date.now()}`,
          direction: 'outbound',
          content: { type: 'text', text },
          platformMessageId: null,
          status: isNote ? 'delivered' : 'sending',
          metadata: isNote ? { isNote: true } : {},
          createdAt: new Date().toISOString(),
          agent: { id: '', firstName: 'You', lastName: null, avatarUrl: null },
        }
        addMessage(optimisticMessage)

        updateConversation(selectedConversationId, {
          lastMessagePreview: text.slice(0, 255),
          lastMessageAt: new Date().toISOString(),
        })
      } finally {
        setSending(false)
      }
    },
    [selectedConversationId],
  )

  const handleTypingStart = useCallback(() => {
    if (!selectedConversationId) return
    // TODO: socket.emit('typing:start', { conversationId: selectedConversationId })
  }, [selectedConversationId])

  const handleTypingStop = useCallback(() => {
    if (!selectedConversationId) return
    // TODO: socket.emit('typing:stop', { conversationId: selectedConversationId })
  }, [selectedConversationId])

  const handleAssign = useCallback(
    async (_agentId: string | null) => {
      if (!selectedConversationId) return
    },
    [selectedConversationId],
  )

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <ConversationList />

      <div className="flex flex-1 flex-col">
        {selectedConversationId && conversationDetail && (
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {conversationDetail.contact.firstName ??
                    conversationDetail.contact.platformUserId}
                  {conversationDetail.contact.lastName
                    ? ` ${conversationDetail.contact.lastName}`
                    : ''}
                </p>
                <p className="text-[11px] text-muted-foreground capitalize">
                  {conversationDetail.channel.platform} -{' '}
                  {conversationDetail.status}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {conversationDetail.assignedAgent ? (
                <span className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-xs text-foreground">
                  <UserCog className="h-3 w-3" />
                  {conversationDetail.assignedAgent.firstName}
                </span>
              ) : (
                <span className="rounded-md bg-amber-100 px-2 py-1 text-xs text-amber-700">
                  Unassigned
                </span>
              )}

              <button
                onClick={() => setShowContactSidebar(!showContactSidebar)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                title={showContactSidebar ? 'Hide contact info' : 'Show contact info'}
              >
                {showContactSidebar ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelRightOpen className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden">
          <MessageThread
            onSendMessage={handleSendMessage}
            onTypingStart={handleTypingStart}
            onTypingStop={handleTypingStop}
          />

          {showContactSidebar && conversationDetail && (
            <ContactSidebar
              contact={conversationDetail.contact}
              tags={contactTags}
              onClose={() => setShowContactSidebar(false)}
              onAssign={handleAssign}
            />
          )}
        </div>
      </div>
    </div>
  )
}
