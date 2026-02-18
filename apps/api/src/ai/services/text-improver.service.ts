import { Injectable } from '@nestjs/common'
import { AiService } from '../ai.service'
import type { AiProvider } from '../ai.types'

export type TextImproveMode =
  | 'professional'
  | 'casual'
  | 'formal'
  | 'friendly'
  | 'concise'
  | 'expand'
  | 'fix_grammar'
  | 'translate'

@Injectable()
export class TextImproverService {
  constructor(private readonly aiService: AiService) {}

  async improve(
    text: string,
    mode: TextImproveMode,
    options: {
      provider?: AiProvider
      brandVoice?: string
      targetLanguage?: string
    } = {},
  ): Promise<{ improved: string; changes: string }> {
    const modeInstructions = this.getModeInstructions(mode, options.targetLanguage)

    const brandContext = options.brandVoice
      ? `\n\nBrand voice guidelines: ${options.brandVoice}`
      : ''

    const prompt = `Improve the following text. ${modeInstructions}${brandContext}

Original text:
"${text}"

Respond with JSON:
{
  "improved": "the improved text",
  "changes": "brief summary of what was changed"
}`

    const result = await this.aiService.generateJson<{
      improved: string
      changes: string
    }>(prompt, {
      provider: options.provider,
      temperature: 0.5,
      maxTokens: 1024,
      systemPrompt:
        'You are a professional copywriter and editor. Improve text while preserving the original meaning and any template variables like {{contact.first_name}}.',
    })

    return result
  }

  async generateVariations(
    text: string,
    count: number = 3,
    provider?: AiProvider,
  ): Promise<string[]> {
    const prompt = `Generate ${count} different variations of the following message. Each should convey the same meaning but with different wording and style.

Original: "${text}"

Respond with JSON:
{
  "variations": ["variation 1", "variation 2", "variation 3"]
}

Preserve any template variables like {{contact.first_name}}.`

    const result = await this.aiService.generateJson<{
      variations: string[]
    }>(prompt, {
      provider,
      temperature: 0.8,
      maxTokens: 1024,
      systemPrompt: 'You are a creative copywriter generating message variations.',
    })

    return result.variations
  }

  private getModeInstructions(
    mode: TextImproveMode,
    targetLanguage?: string,
  ): string {
    switch (mode) {
      case 'professional':
        return 'Make it sound professional and business-appropriate. Remove slang and casual language.'
      case 'casual':
        return 'Make it sound casual and conversational. Use a relaxed, approachable tone.'
      case 'formal':
        return 'Make it formal and polished. Use proper grammar and sophisticated vocabulary.'
      case 'friendly':
        return 'Make it warm and friendly. Add a personal touch while keeping it clear.'
      case 'concise':
        return 'Make it shorter and more concise. Remove unnecessary words while preserving meaning.'
      case 'expand':
        return 'Expand on the message. Add more detail and context while keeping it natural.'
      case 'fix_grammar':
        return 'Fix grammar, spelling, and punctuation errors. Do not change the style or meaning.'
      case 'translate':
        return `Translate the text to ${targetLanguage ?? 'English'}. Preserve the tone and meaning.`
      default:
        return 'Improve clarity and readability.'
    }
  }
}
