import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Anthropic from '@anthropic-ai/sdk'
import type {
  AiCompletionOptions,
  AiCompletionResult,
  AiMessage,
} from '../ai.types'

@Injectable()
export class AnthropicProvider {
  private client: Anthropic | null = null

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Anthropic {
    if (!this.client) {
      const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY')
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured')
      }
      this.client = new Anthropic({ apiKey })
    }
    return this.client
  }

  async complete(
    messages: AiMessage[],
    options: AiCompletionOptions = {},
  ): Promise<AiCompletionResult> {
    const client = this.getClient()
    const model = options.model ?? 'claude-sonnet-4-20250514'

    const systemPrompt = options.systemPrompt ??
      messages.find((m) => m.role === 'system')?.content

    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

    const response = await client.messages.create({
      model,
      max_tokens: options.maxTokens ?? 1024,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: userMessages,
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    const text = textBlock && 'text' in textBlock ? textBlock.text : ''

    return {
      text,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      model,
      provider: 'anthropic',
    }
  }
}
