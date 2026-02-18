import { create } from 'zustand'

export interface ConversationContact {
  id: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  platform: string
  platformUserId: string
}

export interface ConversationChannel {
  id: string
  platform: string
  name: string
}

export interface ConversationAgent {
  id: string
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
}

export interface ConversationItem {
  id: string
  status: string
  priority: string
  lastMessageAt: string | null
  lastMessagePreview: string | null
  unreadCount: number
  contact: ConversationContact
  channel: ConversationChannel
  assignedAgent: ConversationAgent | null
}

export interface MessageItem {
  id: string
  direction: string
  content: {
    type: string
    text?: string
    attachments?: Array<{ type: string; url: string }>
  }
  platformMessageId: string | null
  status: string
  metadata: Record<string, unknown>
  createdAt: string
  agent?: ConversationAgent | null
}

export type InboxFilter = 'all' | 'mine' | 'unassigned' | 'resolved'

interface InboxState {
  conversations: ConversationItem[]
  selectedConversationId: string | null
  messages: MessageItem[]
  filter: InboxFilter
  search: string
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isSending: boolean

  setConversations: (conversations: ConversationItem[]) => void
  selectConversation: (id: string | null) => void
  setMessages: (messages: MessageItem[]) => void
  addMessage: (message: MessageItem) => void
  setFilter: (filter: InboxFilter) => void
  setSearch: (search: string) => void
  setLoadingConversations: (loading: boolean) => void
  setLoadingMessages: (loading: boolean) => void
  setSending: (sending: boolean) => void
  updateConversation: (id: string, data: Partial<ConversationItem>) => void
}

export const useInboxStore = create<InboxState>((set) => ({
  conversations: [],
  selectedConversationId: null,
  messages: [],
  filter: 'all',
  search: '',
  isLoadingConversations: false,
  isLoadingMessages: false,
  isSending: false,

  setConversations: (conversations) => set({ conversations }),

  selectConversation: (id) =>
    set({ selectedConversationId: id, messages: [] }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),
  setLoadingConversations: (loading) => set({ isLoadingConversations: loading }),
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setSending: (sending) => set({ isSending: sending }),

  updateConversation: (id, data) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...data } : c,
      ),
    })),
}))
