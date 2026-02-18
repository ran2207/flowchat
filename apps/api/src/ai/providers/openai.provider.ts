import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import type {
  AiCompletionOptions,
  AiCompletionResult,
  AiEmbeddingResult,
  AiMessage,
} from '../ai.types'

@Injectable()
export class OpenAiProvider {
  private client: OpenAI | null = null

  constructor(private readonly configService: ConfigService) {}

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = this.configService.get<string>('OPENAI_API_KEY')
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
      }
      this.client = new OpenAI({ apiKey })
    }
    return this.client
  }

  async complete(
    messages: AiMessage[],
    options: AiCompletionOptions = {},
  ): Promise<AiCompletionResult> {
    const client = this.getClient()
    const model = options.model ?? 'gpt-4o-mini'

    const formattedMessages = messages.map((m) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }))

    if (options.systemPrompt) {
      formattedMessages.unshift({
        role: 'system',
        content: options.systemPrompt,
      })
    }

    const response = await client.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1024,
      ...(options.jsonMode
        ? { response_format: { type: 'json_object' } }
        : {}),
    })

    const choice = response.choices[0]

    return {
      text: choice.message.content ?? '',
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      model,
      provider: 'openai',
    }
  }

  async embed(text: string): Promise<AiEmbeddingResult> {
    const client = this.getClient()
    const model = 'text-embedding-3-small'

    const response = await client.embeddings.create({
      model,
      input: text,
    })

    return {
      embedding: response.data[0].embedding,
      model,
      usage: { totalTokens: response.usage.total_tokens },
    }
  }

  async embedBatch(texts: string[]): Promise<AiEmbeddingResult[]> {
    const client = this.getClient()
    const model = 'text-embedding-3-small'

    const response = await client.embeddings.create({
      model,
      input: texts,
    })

    return response.data.map((item) => ({
      embedding: item.embedding,
      model,
      usage: { totalTokens: Math.ceil(response.usage.total_tokens / texts.length) },
    }))
  }
}
