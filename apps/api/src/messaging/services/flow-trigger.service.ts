import { Injectable, Logger } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import { Prisma } from '@prisma/client'
import type { NormalizedIncomingMessage } from '@flowchat/shared'
import { QueueService, QUEUE_NAMES } from '../../queue'

export interface FlowExecutionJob {
  flowId: string
  tenantId: string
  contactId: string
  channelId: string
  triggerMessage: Record<string, unknown>
  flowVersion: number
  definition: Record<string, unknown>
}

@Injectable()
export class FlowTriggerService {
  private readonly logger = new Logger(FlowTriggerService.name)

  constructor(private readonly queueService: QueueService) {}

  async matchAndTrigger(
    tenantId: string,
    contactId: string,
    channelId: string,
    message: NormalizedIncomingMessage,
  ): Promise<void> {
    const publishedFlows = await prisma.flow.findMany({
      where: {
        tenantId,
        status: 'published',
        deletedAt: null,
        publishedDefinition: { not: Prisma.DbNull },
      },
      select: {
        id: true,
        triggerType: true,
        triggerConfig: true,
        publishedDefinition: true,
        currentVersion: true,
      },
    })

    if (publishedFlows.length === 0) return

    for (const flow of publishedFlows) {
      const matched = this.evaluateTrigger(
        flow.triggerType,
        flow.triggerConfig as Record<string, unknown>,
        message,
      )

      if (!matched) continue

      const alreadyRunning = await prisma.flowExecution.findFirst({
        where: {
          flowId: flow.id,
          contactId,
          status: { in: ['running', 'waiting'] },
        },
      })

      if (alreadyRunning) {
        this.logger.debug(
          `Flow ${flow.id} already running for contact ${contactId}, skipping`,
        )
        continue
      }

      const job: FlowExecutionJob = {
        flowId: flow.id,
        tenantId,
        contactId,
        channelId,
        triggerMessage: message as unknown as Record<string, unknown>,
        flowVersion: flow.currentVersion,
        definition: flow.publishedDefinition as Record<string, unknown>,
      }

      await this.queueService.addJob(
        QUEUE_NAMES.FLOW_EXECUTIONS,
        'execute-flow',
        job,
      )

      this.logger.log(
        `Flow ${flow.id} triggered for contact ${contactId} by ${flow.triggerType}`,
      )
    }
  }

  private evaluateTrigger(
    triggerType: string,
    triggerConfig: Record<string, unknown>,
    message: NormalizedIncomingMessage,
  ): boolean {
    switch (triggerType) {
      case 'keyword':
        return this.matchKeywordTrigger(triggerConfig, message)
      case 'any_message':
        return true
      case 'postback':
        return this.matchPostbackTrigger(triggerConfig, message)
      default:
        return false
    }
  }

  private matchKeywordTrigger(
    config: Record<string, unknown>,
    message: NormalizedIncomingMessage,
  ): boolean {
    if (message.content.type !== 'text') return false

    const text = (message.content.text ?? '').toLowerCase().trim()
    if (!text) return false

    const keywords = (config.keywords ?? []) as string[]
    const matchType = (config.matchType ?? 'exact') as string

    return keywords.some((keyword) => {
      const kw = keyword.toLowerCase().trim()
      switch (matchType) {
        case 'exact':
          return text === kw
        case 'contains':
          return text.includes(kw)
        case 'starts_with':
          return text.startsWith(kw)
        default:
          return text === kw
      }
    })
  }

  private matchPostbackTrigger(
    config: Record<string, unknown>,
    message: NormalizedIncomingMessage,
  ): boolean {
    if (!message.postback) return false

    const expectedPayload = config.payload as string | undefined
    if (!expectedPayload) return false

    return message.postback.payload === expectedPayload
  }
}
