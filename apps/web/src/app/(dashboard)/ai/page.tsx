'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  MessageSquare,
  BookOpen,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Check,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

type Tab = 'auto-reply' | 'knowledge' | 'status'

interface AutoReplyConfig {
  enabled: boolean
  provider: string
  model?: string
  tone: string
  personality: string
  guardrails: string[]
  maxTokens: number
  fallbackMessage: string
}

interface KnowledgeEntry {
  id: string
  type: string
  title: string
  content: string
  createdAt: string
}

interface ProviderStatus {
  openai: boolean
  anthropic: boolean
}

export default function AiPage() {
  const [activeTab, setActiveTab] = useState<Tab>('auto-reply')

  const tabs = [
    { id: 'auto-reply' as const, label: 'Auto-Reply', icon: MessageSquare },
    { id: 'knowledge' as const, label: 'Knowledge Base', icon: BookOpen },
    { id: 'status' as const, label: 'AI Providers', icon: Sparkles },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Brain className="h-7 w-7 text-primary" />
          AI Features
        </h1>
        <p className="mt-1 text-muted-foreground">
          Configure AI-powered auto-replies, knowledge base, and providers.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'auto-reply' && <AutoReplyTab />}
        {activeTab === 'knowledge' && <KnowledgeBaseTab />}
        {activeTab === 'status' && <ProviderStatusTab />}
      </div>
    </div>
  )
}

function AutoReplyTab() {
  const [config, setConfig] = useState<AutoReplyConfig>({
    enabled: false,
    provider: 'openai',
    tone: 'professional and friendly',
    personality: 'a helpful customer service assistant',
    guardrails: [
      'Never share internal company data',
      'Do not make up information',
      'If unsure, suggest contacting a human agent',
    ],
    maxTokens: 512,
    fallbackMessage:
      'I apologize, but I need to connect you with a team member for this. One moment please!',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newGuardrail, setNewGuardrail] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const data = await apiFetch<AutoReplyConfig>('/ai/auto-reply/config')
      setConfig(data)
    } catch {
      // Use defaults on error
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      const updated = await apiFetch<AutoReplyConfig>('/ai/auto-reply/config', {
        method: 'POST',
        body: JSON.stringify(config),
      })
      setConfig(updated)
    } catch {
      // Handle error silently
    } finally {
      setSaving(false)
    }
  }

  const addGuardrail = () => {
    if (!newGuardrail.trim()) return
    setConfig((prev) => ({
      ...prev,
      guardrails: [...prev.guardrails, newGuardrail.trim()],
    }))
    setNewGuardrail('')
  }

  const removeGuardrail = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      guardrails: prev.guardrails.filter((_, i) => i !== index),
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between rounded-lg border border-border p-4">
        <div>
          <h3 className="font-medium text-foreground">Enable Auto-Reply</h3>
          <p className="text-sm text-muted-foreground">
            AI will automatically respond to incoming messages.
          </p>
        </div>
        <button
          onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className={cn(
            'relative h-6 w-11 rounded-full transition-colors',
            config.enabled ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
              config.enabled && 'translate-x-5',
            )}
          />
        </button>
      </div>

      <div className="space-y-4 rounded-lg border border-border p-6">
        <h3 className="font-medium text-foreground">Configuration</h3>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            AI Provider
          </label>
          <select
            value={config.provider}
            onChange={(e) => setConfig((prev) => ({ ...prev, provider: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="openai">OpenAI (GPT-4o Mini)</option>
            <option value="anthropic">Anthropic (Claude)</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">Tone</label>
          <input
            type="text"
            value={config.tone}
            onChange={(e) => setConfig((prev) => ({ ...prev, tone: e.target.value }))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g., professional and friendly"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Personality
          </label>
          <input
            type="text"
            value={config.personality}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, personality: e.target.value }))
            }
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            placeholder="e.g., a helpful customer service assistant"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Fallback Message
          </label>
          <textarea
            value={config.fallbackMessage}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, fallbackMessage: e.target.value }))
            }
            rows={2}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border border-border p-6">
        <h3 className="font-medium text-foreground">Guardrails</h3>
        <p className="text-sm text-muted-foreground">
          Rules the AI must follow when generating replies.
        </p>

        <div className="space-y-2">
          {config.guardrails.map((rule, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2"
            >
              <span className="flex-1 text-sm text-foreground">{rule}</span>
              <button
                onClick={() => removeGuardrail(index)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newGuardrail}
            onChange={(e) => setNewGuardrail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addGuardrail()}
            placeholder="Add a guardrail rule..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          />
          <button
            onClick={addGuardrail}
            disabled={!newGuardrail.trim()}
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        onClick={saveConfig}
        disabled={saving}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        Save Configuration
      </button>
    </div>
  )
}

function KnowledgeBaseTab() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    type: 'text' as string,
    title: '',
    content: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadEntries = useCallback(async () => {
    try {
      const data = await apiFetch<KnowledgeEntry[]>('/ai/knowledge')
      setEntries(data)
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const addEntry = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return
    setSubmitting(true)
    try {
      await apiFetch('/ai/knowledge', {
        method: 'POST',
        body: JSON.stringify(formData),
      })
      setFormData({ type: 'text', title: '', content: '' })
      setShowForm(false)
      await loadEntries()
    } catch {
      // Handle silently
    } finally {
      setSubmitting(false)
    }
  }

  const removeEntry = async (id: string) => {
    try {
      await apiFetch(`/ai/knowledge/${id}`, { method: 'DELETE' })
      setEntries((prev) => prev.filter((e) => e.id !== id))
    } catch {
      // Handle silently
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium text-foreground">Knowledge Base</h3>
          <p className="text-sm text-muted-foreground">
            Train your AI with business-specific knowledge for better replies.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-lg border border-border p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="text">Text</option>
              <option value="faq">FAQ</option>
              <option value="url">URL</option>
              <option value="document">Document</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="e.g., Pricing information"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={5}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
              placeholder="Paste your content here..."
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={addEntry}
              disabled={submitting || !formData.title.trim() || !formData.content.trim()}
              className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Add Entry
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No knowledge base entries yet. Add content to train your AI.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start justify-between rounded-lg border border-border p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                    {entry.type}
                  </span>
                  <h4 className="text-sm font-medium text-foreground">{entry.title}</h4>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {entry.content}
                </p>
              </div>
              <button
                onClick={() => removeEntry(entry.id)}
                className="ml-4 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ProviderStatusTab() {
  const [status, setStatus] = useState<ProviderStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const data = await apiFetch<ProviderStatus>('/ai/status')
        setStatus(data)
      } catch {
        // Handle silently
      } finally {
        setLoading(false)
      }
    }
    loadStatus()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const providers = [
    {
      name: 'OpenAI',
      description: 'GPT-4o, GPT-4o Mini, text-embedding-3-small',
      configured: status?.openai ?? false,
      envVar: 'OPENAI_API_KEY',
    },
    {
      name: 'Anthropic',
      description: 'Claude Sonnet 4, Claude Haiku',
      configured: status?.anthropic ?? false,
      envVar: 'ANTHROPIC_API_KEY',
    },
  ]

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure AI providers by setting the API keys in your environment variables.
      </p>

      {providers.map((provider) => (
        <div
          key={provider.name}
          className="flex items-center justify-between rounded-lg border border-border p-4"
        >
          <div>
            <h3 className="font-medium text-foreground">{provider.name}</h3>
            <p className="text-sm text-muted-foreground">{provider.description}</p>
            <code className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
              {provider.envVar}
            </code>
          </div>
          <div className="flex items-center gap-2">
            {provider.configured ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium text-amber-600">Not configured</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
