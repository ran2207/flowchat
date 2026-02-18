'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Key,
  Webhook,
  Loader2,
  Trash2,
  Copy,
  Check,
  TestTube,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  X,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────────

interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  permissions: string[]
  rateLimit: number
  lastUsedAt: string | null
  createdAt: string
  revokedAt: string | null
}

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: string
}

interface ZapierConfig {
  connected: boolean
  subscribedEvents: string[]
}

interface GoogleSheetsConfig {
  connected: boolean
  spreadsheetId: string | null
}

const WEBHOOK_EVENTS = [
  'contact.created',
  'contact.updated',
  'contact.tagged',
  'message.received',
  'message.sent',
  'conversation.opened',
  'conversation.resolved',
  'flow.triggered',
  'flow.completed',
  'broadcast.sent',
]

const TABS = [
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'connections', label: 'Connections', icon: ExternalLink },
] as const

type TabId = (typeof TABS)[number]['id']

// ─── Main Page ──────────────────────────────────────────────

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('api-keys')

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Manage API keys, webhooks, and third-party connections
        </p>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'api-keys' && <ApiKeysTab />}
      {activeTab === 'webhooks' && <WebhooksTab />}
      {activeTab === 'connections' && <ConnectionsTab />}
    </div>
  )
}

// ─── API Keys Tab ───────────────────────────────────────────

function ApiKeysTab() {
  const [keys, setKeys] = useState<ApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadKeys = useCallback(async () => {
    try {
      const data = await apiFetch<ApiKeyInfo[]>('/api-keys')
      setKeys(data)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadKeys()
  }, [loadKeys])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    try {
      const result = await apiFetch<{ key: string; keyInfo: ApiKeyInfo }>('/api-keys', {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName, permissions: ['read', 'write'] }),
      })
      setRevealedKey(result.key)
      setKeys((prev) => [result.keyInfo, ...prev])
      setNewKeyName('')
    } catch {
      /* noop */
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    try {
      await apiFetch(`/api-keys/${id}`, { method: 'DELETE' })
      setKeys((prev) =>
        prev.map((k) =>
          k.id === id ? { ...k, revokedAt: new Date().toISOString() } : k,
        ),
      )
    } catch {
      /* noop */
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {revealedKey && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4">
          <p className="mb-2 text-sm font-medium text-yellow-600">
            Copy your API key now. It won't be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
              {revealedKey}
            </code>
            <button
              onClick={() => handleCopy(revealedKey, 'new-key')}
              className="rounded-md border border-border p-2 hover:bg-accent"
            >
              {copiedId === 'new-key' ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setRevealedKey(null)}
              className="rounded-md border border-border p-2 hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-3 text-sm font-medium text-foreground">Create API Key</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g. Production, Staging)"
            className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Key'}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-medium text-foreground">API Keys ({keys.length})</h3>
        </div>
        {keys.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No API keys yet. Create one to start using the public API.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {keys.map((key) => (
              <div
                key={key.id}
                className={`flex items-center justify-between px-4 py-3 ${
                  key.revokedAt ? 'opacity-50' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{key.name}</span>
                    {key.revokedAt && (
                      <span className="rounded bg-red-500/10 px-2 py-0.5 text-xs text-red-500">
                        Revoked
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-mono">{key.prefix}...</span>
                    <span>
                      Created {new Date(key.createdAt).toLocaleDateString()}
                    </span>
                    {key.lastUsedAt && (
                      <span>
                        Last used {new Date(key.lastUsedAt).toLocaleDateString()}
                      </span>
                    )}
                    <span className="rounded bg-muted px-1.5 py-0.5">
                      {key.permissions.join(', ')}
                    </span>
                  </div>
                </div>
                {!key.revokedAt && (
                  <button
                    onClick={() => handleRevoke(key.id)}
                    className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Revoke key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium text-foreground">API Documentation</h3>
        <p className="mb-3 text-sm text-muted-foreground">
          Use the public API to programmatically manage contacts, trigger flows, send messages, and more.
        </p>
        <div className="space-y-2 rounded-lg bg-muted/50 p-3 font-mono text-xs">
          <p className="text-muted-foreground"># Example: List contacts</p>
          <p>curl -H &quot;X-API-Key: fc_your_key_here&quot; \</p>
          <p className="pl-4">http://localhost:4000/api/v1/contacts</p>
          <p className="mt-2 text-muted-foreground"># Example: Send a message</p>
          <p>curl -X POST -H &quot;X-API-Key: fc_your_key_here&quot; \</p>
          <p className="pl-4">-H &quot;Content-Type: application/json&quot; \</p>
          <p className="pl-4">-d &apos;&#123;&quot;contactId&quot;:&quot;...&quot;,&quot;channelId&quot;:&quot;...&quot;,&quot;text&quot;:&quot;Hello!&quot;&#125;&apos; \</p>
          <p className="pl-4">http://localhost:4000/api/v1/messages/send</p>
        </div>
      </div>
    </div>
  )
}

// ─── Webhooks Tab ───────────────────────────────────────────

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{
    id: string
    success: boolean
    message: string
  } | null>(null)

  const loadWebhooks = useCallback(async () => {
    try {
      const data = await apiFetch<WebhookConfig[]>('/integrations/webhooks')
      setWebhooks(data)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWebhooks()
  }, [loadWebhooks])

  const handleCreate = async () => {
    if (!formName.trim() || !formUrl.trim() || formEvents.length === 0) return
    setSaving(true)
    try {
      const webhook = await apiFetch<WebhookConfig>('/integrations/webhooks', {
        method: 'POST',
        body: JSON.stringify({ name: formName, url: formUrl, events: formEvents }),
      })
      setWebhooks((prev) => [webhook, ...prev])
      setShowForm(false)
      setFormName('')
      setFormUrl('')
      setFormEvents([])
    } catch {
      /* noop */
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await apiFetch(`/integrations/webhooks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive }),
      })
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive: !isActive } : w)),
      )
    } catch {
      /* noop */
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/integrations/webhooks/${id}`, { method: 'DELETE' })
      setWebhooks((prev) => prev.filter((w) => w.id !== id))
    } catch {
      /* noop */
    }
  }

  const handleTest = async (id: string) => {
    setTesting(id)
    setTestResult(null)
    try {
      const result = await apiFetch<{ success: boolean; statusCode?: number; error?: string }>(
        `/integrations/webhooks/${id}/test`,
        { method: 'POST' },
      )
      setTestResult({
        id,
        success: result.success,
        message: result.success
          ? `Success (${result.statusCode})`
          : result.error ?? 'Failed',
      })
    } catch {
      setTestResult({ id, success: false, message: 'Request failed' })
    } finally {
      setTesting(null)
    }
  }

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Send real-time event notifications to external URLs
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          {showForm ? 'Cancel' : 'Add Webhook'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="My Webhook"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">URL</label>
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://example.com/webhook"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Events</label>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map((event) => (
                <button
                  key={event}
                  onClick={() => toggleEvent(event)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    formEvents.includes(event)
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-border bg-background text-muted-foreground hover:border-primary'
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={saving || !formName.trim() || !formUrl.trim() || formEvents.length === 0}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Webhook'}
          </button>
        </div>
      )}

      <div className="space-y-3">
        {webhooks.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            No webhooks configured. Add one to receive event notifications.
          </div>
        ) : (
          webhooks.map((webhook) => (
            <div key={webhook.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(webhook.id, webhook.isActive)}
                    className="text-muted-foreground"
                  >
                    {webhook.isActive ? (
                      <ToggleRight className="h-6 w-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="h-6 w-6" />
                    )}
                  </button>
                  <div>
                    <p className="text-sm font-medium text-foreground">{webhook.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{webhook.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {testResult?.id === webhook.id && (
                    <span
                      className={`text-xs ${
                        testResult.success ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {testResult.message}
                    </span>
                  )}
                  <button
                    onClick={() => handleTest(webhook.id)}
                    disabled={testing === webhook.id}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-accent"
                    title="Send test event"
                  >
                    {testing === webhook.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TestTube className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(webhook.id)}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Delete webhook"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {webhook.events.map((event) => (
                  <span
                    key={event}
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {event}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Connections Tab ────────────────────────────────────────

function ConnectionsTab() {
  const [zapier, setZapier] = useState<ZapierConfig | null>(null)
  const [sheets, setSheets] = useState<GoogleSheetsConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      apiFetch<ZapierConfig>('/integrations/zapier').catch(() => null),
      apiFetch<GoogleSheetsConfig>('/integrations/google-sheets').catch(() => null),
    ])
      .then(([z, g]) => {
        if (z) setZapier(z)
        if (g) setSheets(g)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleDisconnectZapier = async () => {
    try {
      await apiFetch('/integrations/zapier', { method: 'DELETE' })
      setZapier({ connected: false, subscribedEvents: [] })
    } catch {
      /* noop */
    }
  }

  const handleDisconnectSheets = async () => {
    try {
      await apiFetch('/integrations/google-sheets', { method: 'DELETE' })
      setSheets({ connected: false, spreadsheetId: null })
    } catch {
      /* noop */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const connections = [
    {
      name: 'Zapier',
      description: 'Connect FlowChat to 5,000+ apps via Zapier',
      connected: zapier?.connected ?? false,
      details: zapier?.connected
        ? `${zapier.subscribedEvents.length} events subscribed`
        : 'Not connected',
      onConnect: () => {
        window.open('https://zapier.com/apps', '_blank')
      },
      onDisconnect: handleDisconnectZapier,
      color: 'bg-orange-500',
    },
    {
      name: 'Google Sheets',
      description: 'Sync contacts and data with Google Sheets',
      connected: sheets?.connected ?? false,
      details: sheets?.connected
        ? `Spreadsheet: ${sheets.spreadsheetId}`
        : 'Not connected',
      onConnect: () => {
        window.open(
          `https://accounts.google.com/o/oauth2/v2/auth?scope=https://www.googleapis.com/auth/spreadsheets&response_type=code&redirect_uri=${encodeURIComponent(window.location.origin + '/integrations/google-sheets/callback')}&client_id=YOUR_CLIENT_ID`,
          '_blank',
        )
      },
      onDisconnect: handleDisconnectSheets,
      color: 'bg-green-500',
    },
  ]

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Connect FlowChat with your favorite tools and services
      </p>

      {connections.map((conn) => (
        <div
          key={conn.name}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${conn.color} text-white text-sm font-bold`}
              >
                {conn.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-foreground">{conn.name}</h3>
                  {conn.connected && (
                    <span className="rounded bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                      Connected
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{conn.description}</p>
                {conn.connected && (
                  <p className="text-xs text-muted-foreground">{conn.details}</p>
                )}
              </div>
            </div>
            <div>
              {conn.connected ? (
                <button
                  onClick={conn.onDisconnect}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={conn.onConnect}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Connect
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-dashed border-border bg-card/50 p-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">More integrations coming soon</p>
        <p className="text-xs text-muted-foreground">
          Slack, HubSpot, Salesforce, Shopify, and more
        </p>
      </div>
    </div>
  )
}
