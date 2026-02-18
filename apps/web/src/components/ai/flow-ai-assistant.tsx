'use client'

import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Loader2, X, Wand2, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { apiFetch } from '@/lib/api'

interface FlowAiAssistantProps {
  onFlowGenerated: (flow: GeneratedFlowResult) => void
  currentFlow?: Record<string, unknown> | null
}

interface GeneratedFlowResult {
  nodes: Record<
    string,
    {
      id: string
      type: string
      config: Record<string, unknown>
      position: { x: number; y: number }
    }
  >
  edges: Array<{
    source: string
    target: string
    sourceHandle?: string
  }>
  variables: Array<{ name: string; defaultValue: unknown }>
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  flow?: GeneratedFlowResult
}

export const FlowAiAssistant = ({
  onFlowGenerated,
  currentFlow,
}: FlowAiAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Describe the automation flow you want to build, and I\'ll generate it for you. For example: "When someone says hello, send a welcome message with buttons for support and sales."',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleGenerate = async () => {
    if (!input.trim() || loading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const isRefine = currentFlow && Object.keys(currentFlow).length > 0
      let result: GeneratedFlowResult

      if (isRefine) {
        result = await apiFetch<GeneratedFlowResult>('/ai/flow/refine', {
          method: 'POST',
          body: JSON.stringify({
            currentFlow,
            instruction: userMessage.content,
          }),
        })
      } else {
        result = await apiFetch<GeneratedFlowResult>('/ai/flow/generate', {
          method: 'POST',
          body: JSON.stringify({
            description: userMessage.content,
          }),
        })
      }

      const nodeCount = Object.keys(result.nodes).length
      const edgeCount = result.edges.length
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've generated a flow with ${nodeCount} nodes and ${edgeCount} connections. Click "Apply Flow" to load it into the builder.`,
        flow: result,
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't generate the flow. ${error instanceof Error ? error.message : 'Please try again with a different description.'}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        <Sparkles className="h-4 w-4" />
        AI Assistant
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col rounded-xl border border-border bg-card shadow-xl">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Flow AI Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start',
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
              )}
            >
              <p>{msg.content}</p>
              {msg.flow && (
                <button
                  onClick={() => onFlowGenerated(msg.flow!)}
                  className="mt-2 flex items-center gap-1.5 rounded-md bg-background/50 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-background/80"
                >
                  <Wand2 className="h-3 w-3" />
                  Apply Flow
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Generating flow...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border px-4 py-3">
        {currentFlow && Object.keys(currentFlow).length > 0 && (
          <div className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <RefreshCw className="h-3 w-3" />
            Refine mode: will modify current flow
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
            placeholder={
              currentFlow
                ? 'Describe changes to make...'
                : 'Describe the flow to build...'
            }
            disabled={loading}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-50"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className="rounded-md bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
