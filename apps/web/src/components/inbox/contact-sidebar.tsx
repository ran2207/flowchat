'use client'

import { useState } from 'react'
import {
  X,
  Mail,
  Phone,
  Globe,
  Tag,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactInfo {
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

interface ConversationSummary {
  id: string
  status: string
  lastMessageAt: string | null
  lastMessagePreview: string | null
  channel: { id: string; platform: string; name: string }
}

interface ContactSidebarProps {
  contact: ContactInfo | null
  conversations?: ConversationSummary[]
  tags?: Array<{ id: string; name: string; color: string | null }>
  onClose: () => void
  onAssign?: (agentId: string | null) => void
}

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:bg-accent/50"
      >
        {title}
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string | null
}) {
  if (!value) return null

  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="truncate text-xs text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function ContactSidebar({
  contact,
  conversations,
  tags,
  onClose,
}: ContactSidebarProps) {
  if (!contact) return null

  const displayName =
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.platformUserId

  const initials = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="flex h-full w-80 flex-col border-l border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Contact Info</h3>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center border-b border-border py-5">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-primary">
              {initials}
            </div>
          )}
          <p className="mt-2 text-sm font-semibold text-foreground">
            {displayName}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
              {contact.platform}
            </span>
            {contact.isSubscribed ? (
              <span className="flex items-center gap-0.5 text-[10px] text-green-600">
                <UserCheck className="h-3 w-3" /> Subscribed
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-[10px] text-red-500">
                <UserX className="h-3 w-3" /> Unsubscribed
              </span>
            )}
          </div>
        </div>

        <Section title="Details">
          <InfoRow icon={Mail} label="Email" value={contact.email} />
          <InfoRow icon={Phone} label="Phone" value={contact.phone} />
          <InfoRow icon={Globe} label="Platform ID" value={contact.platformUserId} />
          <InfoRow
            icon={Calendar}
            label="Created"
            value={new Date(contact.createdAt).toLocaleDateString()}
          />
          <InfoRow
            icon={Clock}
            label="Last interaction"
            value={
              contact.lastInteractionAt
                ? new Date(contact.lastInteractionAt).toLocaleString()
                : null
            }
          />
        </Section>

        {tags && tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {tag.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {contact.customFields &&
          Object.keys(contact.customFields).length > 0 && (
            <Section title="Custom Fields" defaultOpen={false}>
              <div className="space-y-1.5">
                {Object.entries(contact.customFields).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {key}
                    </span>
                    <span className="text-[11px] font-medium text-foreground">
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

        {conversations && conversations.length > 0 && (
          <Section title="Conversations" defaultOpen={false}>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="rounded-md border border-border p-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {conv.channel.platform}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        conv.status === 'open'
                          ? 'bg-green-100 text-green-700'
                          : conv.status === 'resolved'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600',
                      )}
                    >
                      {conv.status}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-foreground">
                    {conv.lastMessagePreview ?? 'No messages'}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  )
}
