'use client'

import { Search, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  useInboxStore,
  type InboxFilter,
  type ConversationItem,
} from '@/stores/inbox.store'

const PLATFORM_COLORS: Record<string, string> = {
  telegram: 'bg-blue-500',
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500',
  facebook: 'bg-blue-600',
  whatsapp: 'bg-green-500',
  tiktok: 'bg-gray-900',
  sms: 'bg-yellow-500',
  email: 'bg-red-500',
}

const FILTERS: { label: string; value: InboxFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Mine', value: 'mine' },
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'Resolved', value: 'resolved' },
]

function formatTime(dateStr: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function ContactAvatar({ contact }: { contact: ConversationItem['contact'] }) {
  const initials = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join('')
    .toUpperCase() || '?'

  if (contact.avatarUrl) {
    return (
      <img
        src={contact.avatarUrl}
        alt={initials}
        className="h-10 w-10 rounded-full object-cover"
      />
    )
  }

  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
      {initials}
    </div>
  )
}

export function ConversationList() {
  const {
    conversations,
    selectedConversationId,
    filter,
    search,
    isLoadingConversations,
    selectConversation,
    setFilter,
    setSearch,
  } = useInboxStore()

  const filteredConversations = conversations.filter((c) => {
    if (search) {
      const name = `${c.contact.firstName ?? ''} ${c.contact.lastName ?? ''}`.toLowerCase()
      const preview = (c.lastMessagePreview ?? '').toLowerCase()
      if (!name.includes(search.toLowerCase()) && !preview.includes(search.toLowerCase())) {
        return false
      }
    }
    return true
  })

  return (
    <div className="flex h-full w-80 flex-col border-r border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
          {conversations.length}
        </span>
      </div>

      <div className="flex gap-1 border-b border-border px-3 py-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              filter === f.value
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-accent',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="border-b border-border px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-1.5 pl-8 pr-3 text-xs placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoadingConversations ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">No conversations</p>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => selectConversation(conversation.id)}
              className={cn(
                'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors hover:bg-accent/50',
                selectedConversationId === conversation.id && 'bg-accent',
              )}
            >
              <div className="relative flex-shrink-0">
                <ContactAvatar contact={conversation.contact} />
                <span
                  className={cn(
                    'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background',
                    PLATFORM_COLORS[conversation.channel.platform] ?? 'bg-gray-400',
                  )}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground truncate">
                    {conversation.contact.firstName ?? conversation.contact.platformUserId}
                    {conversation.contact.lastName ? ` ${conversation.contact.lastName}` : ''}
                  </span>
                  <span className="ml-2 flex-shrink-0 text-[10px] text-muted-foreground">
                    {formatTime(conversation.lastMessageAt)}
                  </span>
                </div>

                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {conversation.lastMessagePreview ?? 'No messages yet'}
                </p>

                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {conversation.channel.platform}
                  </span>
                  {conversation.assignedAgent && (
                    <span className="text-[10px] text-muted-foreground">
                      {conversation.assignedAgent.firstName}
                    </span>
                  )}
                </div>
              </div>

              {conversation.unreadCount > 0 && (
                <span className="mt-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {conversation.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  )
}
