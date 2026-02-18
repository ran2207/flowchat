'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Send,
  Plus,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Users,
  Calendar,
  Play,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

interface Broadcast {
  id: string
  name: string
  status: string
  content: Record<string, unknown>
  audienceFilter: Record<string, unknown>
  scheduledAt: string | null
  startedAt: string | null
  completedAt: string | null
  stats: { total: number; sent: number; delivered: number; failed: number }
  createdAt: string
  channel?: { id: string; name: string; platform: string } | null
  createdBy?: { id: string; firstName: string | null; lastName: string | null } | null
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    sending: 'bg-amber-100 text-amber-700',
    completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  }

  const icons: Record<string, typeof Clock> = {
    draft: Clock,
    scheduled: Calendar,
    sending: Loader2,
    completed: CheckCircle,
    failed: AlertCircle,
  }

  const Icon = icons[status] ?? Clock

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      <Icon className={cn('h-3 w-3', status === 'sending' && 'animate-spin')} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedBroadcast, setSelectedBroadcast] = useState<Broadcast | null>(null)

  const loadBroadcasts = useCallback(async () => {
    try {
      const data = await apiFetch<{ broadcasts: Broadcast[] }>('/broadcasts')
      setBroadcasts(data.broadcasts)
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadBroadcasts()
  }, [loadBroadcasts])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Send className="h-6 w-6 text-primary" />
            Broadcasts
          </h1>
          <p className="mt-1 text-muted-foreground">
            Send targeted messages to your audience.
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true)
            setSelectedBroadcast(null)
          }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Broadcast
        </button>
      </div>

      {showCreate && (
        <CreateBroadcastForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadBroadcasts()
          }}
        />
      )}

      {selectedBroadcast && (
        <BroadcastDetail
          broadcast={selectedBroadcast}
          onClose={() => setSelectedBroadcast(null)}
          onAction={() => {
            setSelectedBroadcast(null)
            loadBroadcasts()
          }}
        />
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Send className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-lg font-medium text-foreground">No broadcasts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first broadcast to send messages to your contacts.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((broadcast) => (
              <div
                key={broadcast.id}
                onClick={() => setSelectedBroadcast(broadcast)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 hover:bg-accent/50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-foreground">{broadcast.name}</h3>
                    <StatusBadge status={broadcast.status} />
                    {broadcast.channel && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {broadcast.channel.platform}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Created{' '}
                      {new Date(broadcast.createdAt).toLocaleDateString()}
                    </span>
                    {broadcast.scheduledAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Scheduled:{' '}
                        {new Date(broadcast.scheduledAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-center">
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {broadcast.stats.total}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Total</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-600">
                      {broadcast.stats.sent}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Sent</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-red-600">
                      {broadcast.stats.failed}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Failed</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CreateBroadcastForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [messageText, setMessageText] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim() || !messageText.trim()) return
    setSubmitting(true)

    try {
      const audienceFilter: Record<string, unknown> = {}
      if (tagFilter.trim()) {
        audienceFilter.tags = tagFilter.split(',').map((t) => t.trim())
      }
      if (platformFilter) {
        audienceFilter.platforms = [platformFilter]
      }

      await apiFetch('/broadcasts', {
        method: 'POST',
        body: JSON.stringify({
          name,
          content: { text: messageText },
          audienceFilter,
          scheduledAt: scheduledAt || undefined,
        }),
      })
      onCreated()
    } catch {
      // Handle silently
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-border p-6">
      <h3 className="text-lg font-medium text-foreground">New Broadcast</h3>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekly Newsletter"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Schedule (optional)
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Filter by Tags (comma-separated)
          </label>
          <input
            type="text"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="e.g., vip, newsletter"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Platform
          </label>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="">All Platforms</option>
            <option value="telegram">Telegram</option>
            <option value="instagram">Instagram</option>
            <option value="facebook">Facebook</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="email">Email</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-foreground">
          Message
        </label>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={4}
          placeholder="Type your broadcast message..."
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || !messageText.trim()}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {scheduledAt ? 'Schedule' : 'Create Draft'}
        </button>
        <button
          onClick={onClose}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function BroadcastDetail({
  broadcast,
  onClose,
  onAction,
}: {
  broadcast: Broadcast
  onClose: () => void
  onAction: () => void
}) {
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSend = async () => {
    setSending(true)
    try {
      await apiFetch(`/broadcasts/${broadcast.id}/send`, { method: 'POST' })
      onAction()
    } catch {
      // Handle silently
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await apiFetch(`/broadcasts/${broadcast.id}`, { method: 'DELETE' })
      onAction()
    } catch {
      // Handle silently
    } finally {
      setDeleting(false)
    }
  }

  const content = broadcast.content as Record<string, unknown>
  const { stats } = broadcast

  return (
    <div className="mt-6 rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-medium text-foreground">{broadcast.name}</h3>
          <StatusBadge status={broadcast.status} />
        </div>
        <button
          onClick={onClose}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-xs text-muted-foreground">
            <Users className="mr-1 inline h-3 w-3" />
            Audience
          </p>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
          <p className="text-xs text-muted-foreground">Sent</p>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.delivered}</p>
          <p className="text-xs text-muted-foreground">Delivered</p>
        </div>
        <div className="rounded-md border border-border p-3 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      </div>

      <div className="mt-4 rounded-md bg-muted/50 p-4">
        <h4 className="text-xs font-medium text-muted-foreground">Message Preview</h4>
        <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
          {(content.text as string) ?? 'No text content'}
        </p>
      </div>

      {(broadcast.status === 'draft' || broadcast.status === 'scheduled') && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Send Now
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 rounded-md border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
