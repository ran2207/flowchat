import { Injectable, Logger } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import { AiService } from '../ai.service'
import { KnowledgeBaseService } from './knowledge-base.service'
import type { AiProvider } from '../ai.types'

export interface AutoReplyConfig {
  enabled: boolean
  provider: AiProvider
  model?: string
  tone: string
  personality: string
  guardrails: string[]
  maxTokens: number
  fallbackMessage: string
}

const DEFAULT_CONFIG: AutoReplyConfig = {
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
  fallbackMessage: 'I apologize, but I need to connect you with a team member for this. One moment please!',
}

@Injectable()
export class AutoReplyService {
  private readonly logger = new Logger(AutoReplyService.name)

  constructor(
    private readonly aiService: AiService,
    private readonly knowledgeBase: KnowledgeBaseService,
  ) {}

  async generateReply(
    tenantId: string,
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    config?: Partial<AutoReplyConfig>,
  ): Promise<{ reply: string; confidence: number; usedKnowledge: boolean }> {
    const settings = await this.getConfig(tenantId)
    const mergedConfig = { ...settings, ...config }

    if (!mergedConfig.enabled) {
      return {
        reply: mergedConfig.fallbackMessage,
        confidence: 0,
        usedKnowledge: false,
      }
    }

    const context = await this.knowledgeBase.buildContext(
      tenantId,
      message,
      2000,
    )

    const usedKnowledge = context.length > 0

    const guardrailsText = mergedConfig.guardrails
      .map((g, i) => `${i + 1}. ${g}`)
      .join('\n')

    const systemPrompt = `You are ${mergedConfig.personality}. Your tone should be ${mergedConfig.tone}.

Rules you MUST follow:
${guardrailsText}

${
  usedKnowledge
    ? `Use the following knowledge base to answer questions. Only use information from this context. If the answer is not in the context, say you don't have that information and offer to connect with a human agent.

KNOWLEDGE BASE:
${context}
---`
    : 'You do not have access to a knowledge base. If the user asks a specific question you cannot answer, offer to connect them with a human agent.'
}

Keep responses concise and helpful. Do not use markdown formatting.`

    const messages = [
      ...conversationHistory.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    try {
      const result = await this.aiService.complete(
        messages.map((m) => ({ ...m, role: m.role })),
        {
          provider: mergedConfig.provider,
          model: mergedConfig.model,
          maxTokens: mergedConfig.maxTokens,
          systemPrompt,
          temperature: 0.7,
        },
      )

      return {
        reply: result.text.trim(),
        confidence: usedKnowledge ? 0.85 : 0.6,
        usedKnowledge,
      }
    } catch (error) {
      this.logger.error(
        `Auto-reply generation failed: ${error instanceof Error ? error.message : String(error)}`,
      )

      return {
        reply: mergedConfig.fallbackMessage,
        confidence: 0,
        usedKnowledge: false,
      }
    }
  }

  async getConfig(tenantId: string): Promise<AutoReplyConfig> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant?.settings as Record<string, unknown>) ?? {}
    const aiConfig = (settings.autoReply as Partial<AutoReplyConfig>) ?? {}

    return { ...DEFAULT_CONFIG, ...aiConfig }
  }

  async updateConfig(
    tenantId: string,
    config: Partial<AutoReplyConfig>,
  ): Promise<AutoReplyConfig> {
    const current = await this.getConfig(tenantId)
    const updated = { ...current, ...config }

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    settings.autoReply = updated

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    })

    return updated
  }
}
