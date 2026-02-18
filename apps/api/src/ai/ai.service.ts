import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OpenAiProvider } from './providers/openai.provider'
import { AnthropicProvider } from './providers/anthropic.provider'
import type {
  AiProvider,
  AiMessage,
  AiCompletionOptions,
  AiCompletionResult,
  AiEmbeddingResult,
} from './ai.types'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly defaultProvider: AiProvider

  constructor(
    private readonly configService: ConfigService,
    private readonly openaiProvider: OpenAiProvider,
    private readonly anthropicProvider: AnthropicProvider,
  ) {
    this.defaultProvider =
      (configService.get<string>('AI_DEFAULT_PROVIDER') as AiProvider) ?? 'openai'
  }

  async complete(
    messages: AiMessage[],
    options: AiCompletionOptions & { provider?: AiProvider } = {},
  ): Promise<AiCompletionResult> {
    const provider = options.provider ?? this.defaultProvider

    try {
      switch (provider) {
        case 'anthropic':
          return await this.anthropicProvider.complete(messages, options)
        case 'openai':
        default:
          return await this.openaiProvider.complete(messages, options)
      }
    } catch (error) {
      this.logger.error(
        `AI completion failed (${provider}): ${error instanceof Error ? error.message : String(error)}`,
      )
      throw error
    }
  }

  async embed(text: string): Promise<AiEmbeddingResult> {
    return this.openaiProvider.embed(text)
  }

  async embedBatch(texts: string[]): Promise<AiEmbeddingResult[]> {
    return this.openaiProvider.embedBatch(texts)
  }

  async generateJson<T>(
    prompt: string,
    options: AiCompletionOptions & { provider?: AiProvider } = {},
  ): Promise<T> {
    const result = await this.complete(
      [{ role: 'user', content: prompt }],
      {
        ...options,
        jsonMode: options.provider !== 'anthropic',
        systemPrompt:
          (options.systemPrompt ?? '') +
          '\n\nRespond with valid JSON only. No markdown, no code fences.',
      },
    )

    let text = result.text.trim()

    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
      text = fenceMatch[1].trim()
    }

    return JSON.parse(text) as T
  }

  isProviderConfigured(provider: AiProvider): boolean {
    switch (provider) {
      case 'openai':
        return !!this.configService.get<string>('OPENAI_API_KEY')
      case 'anthropic':
        return !!this.configService.get<string>('ANTHROPIC_API_KEY')
      default:
        return false
    }
  }
}
