'use client'

import { useState } from 'react'
import {
  Search,
  Download,
  Upload,
  Tag,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
  Mail,
  Phone,
  Globe,
  Clock,
  Calendar,
  MessageSquare,
  GitBranch,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ContactListItem {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  platform: string
  platformUserId: string
  isSubscribed: boolean
  lastInteractionAt: string | null
  createdAt: string
  tags: Array<{ id: string; name: string; color: string | null }>
}

interface ContactProfile extends ContactListItem {
  customFields: Record<string, unknown>
  conversations: Array<{
    id: string
    status: string
    lastMessageAt: string | null
    lastMessagePreview: string | null
    channel: { id: string; platform: string; name: string }
  }>
  flowExecutions: Array<{
    id: string
    status: string
    startedAt: string
    completedAt: string | null
    flow: { id: string; name: string }
  }>
}

const PLATFORM_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  tiktok: 'TikTok',
  sms: 'SMS',
  email: 'Email',
}

function ContactAvatar({
  contact,
  size = 'md',
}: {
  contact: { firstName: string | null; lastName: string | null; avatarUrl: string | null }
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .map((n) => n![0])
    .join('')
    .toUpperCase() || '?'

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
  }

  if (contact.avatarUrl) {
    return (
      <img
        src={contact.avatarUrl}
        alt={initials}
        className={cn('rounded-full object-cover', sizeClasses[size])}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-primary/10 font-medium text-primary',
        sizeClasses[size],
      )}
    >
      {initials}
    </div>
  )
}

function ContactTable({
  contacts,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onViewContact,
}: {
  contacts: ContactListItem[]
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
  onToggleSelectAll: () => void
  onViewContact: (id: string) => void
}) {
  const allSelected = contacts.length > 0 && contacts.every((c) => selectedIds.has(c.id))

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="h-4 w-4 rounded border-input"
              />
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Contact</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Platform</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Tags</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground">Last Active</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact) => (
            <tr
              key={contact.id}
              onClick={() => onViewContact(contact.id)}
              className="border-b border-border transition-colors hover:bg-accent/50 cursor-pointer"
            >
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(contact.id)}
                  onChange={() => onToggleSelect(contact.id)}
                  className="h-4 w-4 rounded border-input"
                />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <ContactAvatar contact={contact} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {contact.firstName ?? contact.platformUserId}
                      {contact.lastName ? ` ${contact.lastName}` : ''}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {contact.platformUserId}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-foreground capitalize">
                  {PLATFORM_LABELS[contact.platform] ?? contact.platform}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {contact.email ?? '-'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {contact.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {tag.name}
                    </span>
                  ))}
                  {contact.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{contact.tags.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                {contact.isSubscribed ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    Subscribed
                  </span>
                ) : (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-600">
                    Unsubscribed
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {contact.lastInteractionAt
                  ? new Date(contact.lastInteractionAt).toLocaleDateString()
                  : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ContactDetailPanel({
  contact,
  onClose,
}: {
  contact: ContactProfile
  onClose: () => void
}) {
  const displayName =
    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
    contact.platformUserId

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-96 border-l border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold text-foreground">Contact Profile</h2>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="h-[calc(100%-3.5rem)] overflow-y-auto">
        <div className="flex flex-col items-center border-b border-border py-6">
          <ContactAvatar contact={contact} size="lg" />
          <p className="mt-3 text-base font-semibold text-foreground">{displayName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground capitalize">{contact.platform}</p>
          <div className="mt-2 flex gap-2">
            {contact.isSubscribed ? (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700">
                Subscribed
              </span>
            ) : (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-600">
                Unsubscribed
              </span>
            )}
          </div>
        </div>

        <div className="border-b border-border px-5 py-4">
          <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Contact Info</h3>
          <div className="space-y-2.5">
            {contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{contact.email}</span>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-foreground">{contact.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-foreground">{contact.platformUserId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Joined {new Date(contact.createdAt).toLocaleDateString()}
              </span>
            </div>
            {contact.lastInteractionAt && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Last active {new Date(contact.lastInteractionAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {contact.tags.length > 0 && (
          <div className="border-b border-border px-5 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {contact.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {Object.keys(contact.customFields).length > 0 && (
          <div className="border-b border-border px-5 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Custom Fields</h3>
            <div className="space-y-2">
              {Object.entries(contact.customFields).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{key}</span>
                  <span className="text-xs font-medium text-foreground">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {contact.conversations.length > 0 && (
          <div className="border-b border-border px-5 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
              <MessageSquare className="mr-1 inline h-3.5 w-3.5" />
              Recent Conversations
            </h3>
            <div className="space-y-2">
              {contact.conversations.map((conv) => (
                <div key={conv.id} className="rounded-md border border-border p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {conv.channel.platform} - {conv.channel.name}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        conv.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
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
          </div>
        )}

        {contact.flowExecutions.length > 0 && (
          <div className="px-5 py-4">
            <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">
              <GitBranch className="mr-1 inline h-3.5 w-3.5" />
              Flow History
            </h3>
            <div className="space-y-2">
              {contact.flowExecutions.map((exec) => (
                <div key={exec.id} className="rounded-md border border-border p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">
                      {exec.flow.name}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
                        exec.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : exec.status === 'running'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-red-100 text-red-600',
                      )}
                    >
                      {exec.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(exec.startedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const [contacts] = useState<ContactListItem[]>([])
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [selectedContact, setSelectedContact] = useState<ContactProfile | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const totalPages = 1

  const filteredContacts = contacts.filter((c) => {
    if (search) {
      const name = `${c.firstName ?? ''} ${c.lastName ?? ''}`.toLowerCase()
      const email = (c.email ?? '').toLowerCase()
      const q = search.toLowerCase()
      if (!name.includes(q) && !email.includes(q) && !c.platformUserId.includes(q)) {
        return false
      }
    }
    if (platformFilter && c.platform !== platformFilter) return false
    return true
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContacts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredContacts.map((c) => c.id)))
    }
  }

  const handleViewContact = (id: string) => {
    // TODO: Fetch contact profile from API
    // For now, just find in list
    const contact = contacts.find((c) => c.id === id)
    if (contact) {
      setSelectedContact({
        ...contact,
        customFields: {},
        conversations: [],
        flowExecutions: [],
      })
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contacts</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your subscribers and contacts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent">
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <Upload className="h-4 w-4" />
            Import
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        >
          <option value="">All Platforms</option>
          {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 rounded-md bg-accent px-3 py-1.5">
            <span className="text-xs font-medium text-foreground">
              {selectedIds.size} selected
            </span>
            <button className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/20">
              <Tag className="h-3 w-3" />
              Tag
            </button>
            <button className="flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/20">
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="ml-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-4">
        {filteredContacts.length > 0 ? (
          <>
            <ContactTable
              contacts={filteredContacts}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectAll={toggleSelectAll}
              onViewContact={handleViewContact}
            />

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing {filteredContacts.length} contacts
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <p className="mt-4 text-lg font-medium text-foreground">No contacts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Contacts will appear here when people interact with your channels.
            </p>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No contacts match your search.
          </p>
        )}
      </div>

      {selectedContact && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setSelectedContact(null)}
          />
          <ContactDetailPanel
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
          />
        </>
      )}
    </div>
  )
}
