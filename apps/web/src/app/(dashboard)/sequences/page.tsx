'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Zap,
  Plus,
  Trash2,
  Clock,
  MessageSquare,
  ArrowRight,
  Loader2,
  Users,
  Pause,
  Play,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

interface SequenceStep {
  id: string
  type: 'message' | 'delay'
  content?: { text: string }
  delay?: { duration: number; unit: 'minutes' | 'hours' | 'days' }
}

interface Sequence {
  id: string
  name: string
  status: string
  steps: SequenceStep[]
  createdAt: string
  _count: { subscriptions: number }
}

export default function SequencesPage() {
  const [sequences, setSequences] = useState<Sequence[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadSequences = useCallback(async () => {
    try {
      const data = await apiFetch<{ sequences: Sequence[] }>('/sequences')
      setSequences(data.sequences)
    } catch {
      // Handle silently
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSequences()
  }, [loadSequences])

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/sequences/${id}`, { method: 'DELETE' })
      setSequences((prev) => prev.filter((s) => s.id !== id))
    } catch {
      // Handle silently
    }
  }

  const handleToggleStatus = async (sequence: Sequence) => {
    const newStatus = sequence.status === 'active' ? 'paused' : 'active'
    try {
      await apiFetch(`/sequences/${sequence.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setSequences((prev) =>
        prev.map((s) => (s.id === sequence.id ? { ...s, status: newStatus } : s)),
      )
    } catch {
      // Handle silently
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Zap className="h-6 w-6 text-primary" />
            Sequences
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create automated drip campaigns for your contacts.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Create Sequence
        </button>
      </div>

      {showCreate && (
        <CreateSequenceForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            loadSequences()
          }}
        />
      )}

      <div className="mt-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sequences.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <Zap className="h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-lg font-medium text-foreground">No sequences yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first sequence to automate drip campaigns.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sequences.map((sequence) => (
              <div
                key={sequence.id}
                className="rounded-lg border border-border"
              >
                <div
                  className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent/50"
                  onClick={() =>
                    setExpandedId(expandedId === sequence.id ? null : sequence.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-foreground">{sequence.name}</h3>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        sequence.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : sequence.status === 'paused'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-700',
                      )}
                    >
                      {sequence.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {sequence.steps?.length ?? 0} steps
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {sequence._count.subscriptions} contacts
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleStatus(sequence)
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent"
                        title={
                          sequence.status === 'active'
                            ? 'Pause sequence'
                            : 'Activate sequence'
                        }
                      >
                        {sequence.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(sequence.id)
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {expandedId === sequence.id ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedId === sequence.id && (
                  <div className="border-t border-border px-4 py-4">
                    <SequenceStepsList steps={sequence.steps ?? []} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SequenceStepsList({ steps }: { steps: SequenceStep[] }) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No steps defined yet.</p>
    )
  }

  return (
    <div className="space-y-2">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center gap-3">
          <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
            {index + 1}
          </div>

          {step.type === 'message' ? (
            <div className="flex-1 rounded-md border border-border bg-muted/30 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                Message
              </div>
              <p className="mt-0.5 text-sm text-foreground">
                {(step.content?.text ?? 'No content').substring(0, 100)}
              </p>
            </div>
          ) : (
            <div className="flex-1 rounded-md border border-border bg-amber-50 px-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                <Clock className="h-3 w-3" />
                Wait {step.delay?.duration} {step.delay?.unit}
              </div>
            </div>
          )}

          {index < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  )
}

function CreateSequenceForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [steps, setSteps] = useState<SequenceStep[]>([])
  const [submitting, setSubmitting] = useState(false)

  const addMessageStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: `step_${Date.now()}`,
        type: 'message',
        content: { text: '' },
      },
    ])
  }

  const addDelayStep = () => {
    setSteps((prev) => [
      ...prev,
      {
        id: `step_${Date.now()}`,
        type: 'delay',
        delay: { duration: 1, unit: 'days' },
      },
    ])
  }

  const updateStep = (index: number, update: Partial<SequenceStep>) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...update } : s)),
    )
  }

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!name.trim() || steps.length === 0) return
    setSubmitting(true)
    try {
      await apiFetch('/sequences', {
        method: 'POST',
        body: JSON.stringify({ name, steps }),
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
      <h3 className="text-lg font-medium text-foreground">New Sequence</h3>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-foreground">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Welcome Series"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-foreground">Steps</h4>
          <div className="flex gap-2">
            <button
              onClick={addMessageStep}
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
            >
              <MessageSquare className="h-3 w-3" />
              Message
            </button>
            <button
              onClick={addDelayStep}
              className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Clock className="h-3 w-3" />
              Delay
            </button>
          </div>
        </div>

        {steps.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Add message and delay steps to build your sequence.
          </p>
        ) : (
          steps.map((step, index) => (
            <div
              key={step.id}
              className="flex items-start gap-3 rounded-md border border-border p-3"
            >
              <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                {index + 1}
              </div>

              {step.type === 'message' ? (
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Message
                  </label>
                  <textarea
                    value={step.content?.text ?? ''}
                    onChange={(e) =>
                      updateStep(index, { content: { text: e.target.value } })
                    }
                    rows={2}
                    placeholder="Type the message..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </div>
              ) : (
                <div className="flex flex-1 items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Wait
                  </label>
                  <input
                    type="number"
                    value={step.delay?.duration ?? 1}
                    onChange={(e) =>
                      updateStep(index, {
                        delay: {
                          duration: Math.max(1, Number(e.target.value)),
                          unit: step.delay?.unit ?? 'days',
                        },
                      })
                    }
                    min={1}
                    className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  />
                  <select
                    value={step.delay?.unit ?? 'days'}
                    onChange={(e) =>
                      updateStep(index, {
                        delay: {
                          duration: step.delay?.duration ?? 1,
                          unit: e.target.value as 'minutes' | 'hours' | 'days',
                        },
                      })
                    }
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              )}

              <button
                onClick={() => removeStep(index)}
                className="mt-1 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting || !name.trim() || steps.length === 0}
          className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Create Sequence
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
