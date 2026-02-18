export type AiProvider = 'openai' | 'anthropic'

export interface AiCompletionOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  systemPrompt?: string
  jsonMode?: boolean
}

export interface AiMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AiCompletionResult {
  text: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  provider: AiProvider
}

export interface AiEmbeddingResult {
  embedding: number[]
  model: string
  usage: { totalTokens: number }
}

export interface KnowledgeSource {
  id: string
  tenantId: string
  type: 'url' | 'document' | 'faq' | 'text'
  title: string
  content: string
  metadata: Record<string, unknown>
}

export interface IntentDefinition {
  name: string
  description: string
  examples: string[]
}

export interface IntentMatchResult {
  intent: string
  confidence: number
  reasoning: string
}
