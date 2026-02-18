'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Sparkles,
  Briefcase,
  Coffee,
  GraduationCap,
  Heart,
  Minimize2,
  Maximize2,
  SpellCheck,
  Languages,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

type ImproveMode =
  | 'professional'
  | 'casual'
  | 'formal'
  | 'friendly'
  | 'concise'
  | 'expand'
  | 'fix_grammar'
  | 'translate'

interface TextImproverProps {
  text: string
  onApply: (improvedText: string) => void
}

const modes: Array<{ id: ImproveMode; label: string; icon: typeof Sparkles }> = [
  { id: 'professional', label: 'Professional', icon: Briefcase },
  { id: 'casual', label: 'Casual', icon: Coffee },
  { id: 'formal', label: 'Formal', icon: GraduationCap },
  { id: 'friendly', label: 'Friendly', icon: Heart },
  { id: 'concise', label: 'Concise', icon: Minimize2 },
  { id: 'expand', label: 'Expand', icon: Maximize2 },
  { id: 'fix_grammar', label: 'Fix Grammar', icon: SpellCheck },
  { id: 'translate', label: 'Translate', icon: Languages },
]

export const TextImprover = ({ text, onApply }: TextImproverProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ improved: string; changes: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setResult(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleImprove = async (mode: ImproveMode) => {
    if (!text.trim() || loading) return
    setLoading(true)
    setResult(null)

    try {
      const data = await apiFetch<{ improved: string; changes: string }>('/ai/text/improve', {
        method: 'POST',
        body: JSON.stringify({ text, mode }),
      })
      setResult(data)
    } catch {
      setResult({ improved: text, changes: 'Failed to improve text. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleApply = () => {
    if (result) {
      onApply(result.improved)
      setIsOpen(false)
      setResult(null)
    }
  }

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.improved)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          setResult(null)
        }}
        disabled={!text.trim()}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        title="AI Text Improver"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Improve
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 z-50 mb-1 w-72 rounded-lg border border-border bg-card shadow-lg">
          {result ? (
            <div className="p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {result.changes}
              </p>
              <div className="max-h-40 overflow-y-auto rounded-md bg-muted/50 p-2.5 text-sm text-foreground">
                {result.improved}
              </div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={handleApply}
                  className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Apply
                </button>
                <button
                  onClick={handleCopy}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
                <button
                  onClick={() => setResult(null)}
                  className="rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                >
                  Back
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-1.5">
              <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                Improve text with AI
              </p>
              {modes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => handleImprove(mode.id)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-accent"
                >
                  <mode.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface TextVariationsProps {
  text: string
  onSelect: (variation: string) => void
}

export const TextVariations = ({ text, onSelect }: TextVariationsProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [variations, setVariations] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const generateVariations = async () => {
    if (!text.trim() || loading) return
    setIsOpen(true)
    setLoading(true)

    try {
      const data = await apiFetch<string[]>('/ai/text/variations', {
        method: 'POST',
        body: JSON.stringify({ text, count: 3 }),
      })
      setVariations(data)
    } catch {
      setVariations([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={generateVariations}
        disabled={!text.trim() || loading}
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
        )}
        title="Generate message variations"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        Variations
      </button>

      {isOpen && !loading && variations.length > 0 && (
        <div className="absolute bottom-full right-0 z-50 mb-1 w-80 rounded-lg border border-border bg-card shadow-lg">
          <div className="p-1.5">
            <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Message Variations
            </p>
            {variations.map((variation, index) => (
              <button
                key={index}
                onClick={() => {
                  onSelect(variation)
                  setIsOpen(false)
                }}
                className="w-full rounded-md px-2.5 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                {variation}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
