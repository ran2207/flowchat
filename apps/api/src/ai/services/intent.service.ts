import { Injectable, Logger } from '@nestjs/common'
import { AiService } from '../ai.service'
import type { IntentDefinition, IntentMatchResult, AiProvider } from '../ai.types'

@Injectable()
export class IntentService {
  private readonly logger = new Logger(IntentService.name)

  constructor(private readonly aiService: AiService) {}

  async matchIntent(
    message: string,
    intents: IntentDefinition[],
    provider?: AiProvider,
  ): Promise<IntentMatchResult | null> {
    if (intents.length === 0) return null

    const intentDescriptions = intents
      .map(
        (intent, i) =>
          `${i + 1}. "${intent.name}": ${intent.description}\n   Examples: ${intent.examples.map((e) => `"${e}"`).join(', ')}`,
      )
      .join('\n')

    const prompt = `Analyze the following user message and determine which intent it matches.

Available intents:
${intentDescriptions}

User message: "${message}"

Respond with JSON:
{
  "intent": "intent_name or null if no match",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation"
}

Only match if confidence is above 0.6. If no intent matches well, set intent to null.`

    try {
      const result = await this.aiService.generateJson<IntentMatchResult>(
        prompt,
        {
          provider,
          temperature: 0.1,
          maxTokens: 256,
          systemPrompt:
            'You are an intent classification system. Analyze messages and match them to defined intents with high accuracy.',
        },
      )

      if (!result.intent || result.confidence < 0.6) {
        return null
      }

      return result
    } catch (error) {
      this.logger.error(
        `Intent matching failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return null
    }
  }

  async classifyMultiple(
    message: string,
    intents: IntentDefinition[],
    provider?: AiProvider,
  ): Promise<IntentMatchResult[]> {
    if (intents.length === 0) return []

    const intentDescriptions = intents
      .map(
        (intent, i) =>
          `${i + 1}. "${intent.name}": ${intent.description}\n   Examples: ${intent.examples.map((e) => `"${e}"`).join(', ')}`,
      )
      .join('\n')

    const prompt = `Analyze the following user message and score ALL intents.

Available intents:
${intentDescriptions}

User message: "${message}"

Respond with JSON:
{
  "matches": [
    { "intent": "intent_name", "confidence": 0.0 to 1.0, "reasoning": "brief explanation" }
  ]
}

Score every intent. Sort by confidence descending.`

    try {
      const result = await this.aiService.generateJson<{
        matches: IntentMatchResult[]
      }>(prompt, {
        provider,
        temperature: 0.1,
        maxTokens: 512,
        systemPrompt:
          'You are an intent classification system. Score all intents accurately.',
      })

      return result.matches.filter((m) => m.confidence > 0.3)
    } catch (error) {
      this.logger.error(
        `Multi-intent classification failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return []
    }
  }
}
