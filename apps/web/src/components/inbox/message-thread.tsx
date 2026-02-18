'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Send,
  StickyNote,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useInboxStore, type MessageItem } from '@/stores/inbox.store'

function formatMessageTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function MessageStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'sending':
      return <Clock className="h-3 w-3 text-muted-foreground" />
    case 'sent':
      return <Check className="h-3 w-3 text-muted-foreground" />
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />
    case 'failed':
      return <AlertCircle className="h-3 w-3 text-destructive" />
    default:
      return null
  }
}

function MessageBubble({ message }: { message: MessageItem }) {
  const isOutbound = message.direction === 'outbound'
  const isNote = (message.metadata as Record<string, unknown>)?.isNote === true
  const content = message.content

  if (isNote) {
    return (
      <div className="mx-auto my-2 max-w-md">
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
          <div className="flex items-center gap-1.5 text-[10px] text-yellow-700">
            <StickyNote className="h-3 w-3" />
            <span className="font-medium">
              {message.agent?.firstName ?? 'Agent'} - Internal Note
            </span>
            <span className="ml-auto">{formatMessageTime(message.createdAt)}</span>
          </div>
          <p className="mt-1 text-xs text-yellow-900">{content.text}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'my-1 flex',
        isOutbound ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2',
          isOutbound
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md bg-accent text-foreground',
        )}
      >
        {isOutbound && message.agent && (
          <p className={cn(
            'mb-0.5 text-[10px] font-medium',
            isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground',
          )}>
            {message.agent.firstName}
          </p>
        )}

        {content.attachments?.map((att, i) => (
          <div key={i} className="mb-1">
            {att.type === 'image' ? (
              <img
                src={att.url}
                alt="attachment"
                className="max-h-48 rounded-lg"
              />
            ) : (
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline"
              >
                {att.type} attachment
              </a>
            )}
          </div>
        ))}

        {content.text && (
          <p className="text-sm whitespace-pre-wrap break-words">{content.text}</p>
        )}

        <div
          className={cn(
            'mt-1 flex items-center gap-1',
            isOutbound ? 'justify-end' : 'justify-start',
          )}
        >
          <span
            className={cn(
              'text-[10px]',
              isOutbound ? 'text-primary-foreground/50' : 'text-muted-foreground',
            )}
          >
            {formatMessageTime(message.createdAt)}
          </span>
          {isOutbound && <MessageStatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  )
}

interface MessageThreadProps {
  onSendMessage: (text: string, isNote: boolean) => void
  onTypingStart: () => void
  onTypingStop: () => void
}

export function MessageThread({
  onSendMessage,
  onTypingStart,
  onTypingStop,
}: MessageThreadProps) {
  const { messages, selectedConversationId, isLoadingMessages, isSending } =
    useInboxStore()
  const [text, setText] = useState('')
  const [isNoteMode, setIsNoteMode] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setText('')
    setIsNoteMode(false)
  }, [selectedConversationId])

  const handleInputChange = (value: string) => {
    setText(value)

    if (!isNoteMode) {
      onTypingStart()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => onTypingStop(), 2000)
    }
  }

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return

    onSendMessage(trimmed, isNoteMode)
    setText('')

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      onTypingStop()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!selectedConversationId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <User className="h-8 w-8 text-primary" />
        </div>
        <p className="mt-4 text-lg font-medium text-foreground">
          Select a conversation
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a conversation from the sidebar to start chatting.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {isLoadingMessages ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        {isNoteMode && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md bg-yellow-50 px-3 py-1.5">
            <StickyNote className="h-3.5 w-3.5 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700">
              Internal note - only visible to your team
            </span>
            <button
              onClick={() => setIsNoteMode(false)}
              className="ml-auto text-xs text-yellow-700 underline"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setIsNoteMode(!isNoteMode)}
              className={cn(
                'rounded-md p-2 transition-colors',
                isNoteMode
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'text-muted-foreground hover:bg-accent',
              )}
              title="Internal note"
            >
              <StickyNote className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isNoteMode
                  ? 'Write an internal note...'
                  : 'Type a message...'
              }
              rows={1}
              className={cn(
                'w-full resize-none rounded-lg border px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1',
                isNoteMode
                  ? 'border-yellow-300 bg-yellow-50 focus:ring-yellow-400'
                  : 'border-input bg-background focus:ring-primary',
              )}
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className={cn(
              'rounded-lg p-2 transition-colors',
              text.trim()
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
