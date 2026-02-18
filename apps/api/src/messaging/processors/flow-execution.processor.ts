import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common'
import { Worker, type Job, type ConnectionOptions } from 'bullmq'
import { prisma } from '@flowchat/database'
import type { NormalizedMessageContent } from '@flowchat/shared'
import { QUEUE_NAMES, QueueService } from '../../queue'
import type { FlowExecutionJob } from '../services/flow-trigger.service'
import { ContactService } from '../services/contact.service'
import type { OutgoingMessageJob } from './outgoing-message.processor'

interface FlowNode {
  id: string
  type: string
  config: Record<string, unknown>
  outputs?: Array<{ handle: string; label?: string }>
}

interface FlowEdge {
  source: string
  target: string
  sourceHandle?: string
}

interface FlowDefinition {
  nodes: Record<string, FlowNode>
  edges: FlowEdge[]
  variables?: Array<{ name: string; defaultValue: unknown }>
}

const MAX_STEPS = 100

@Injectable()
export class FlowExecutionProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FlowExecutionProcessor.name)
  private worker: Worker | null = null

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redisConnection: ConnectionOptions,
    private readonly queueService: QueueService,
    private readonly contactService: ContactService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE_NAMES.FLOW_EXECUTIONS,
      async (job: Job<FlowExecutionJob>) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 10,
      },
    )

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Flow execution job ${job?.id} failed: ${err.message}`,
        err.stack,
      )
    })

    this.logger.log('Flow execution processor started')
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close()
    }
  }

  private async process(job: Job<FlowExecutionJob>): Promise<void> {
    const { flowId, tenantId, contactId, channelId, flowVersion, definition } =
      job.data

    const flowDef = definition as unknown as FlowDefinition

    const execution = await prisma.flowExecution.create({
      data: {
        tenantId,
        flowId,
        contactId,
        flowVersion,
        status: 'running',
        variables: this.initializeVariables(flowDef.variables),
        history: [],
      },
    })

    const startNodeId = this.findStartNode(flowDef)
    if (!startNodeId) {
      await this.completeExecution(execution.id, 'failed', 'No start node found')
      return
    }

    const contact = await prisma.contact.findUniqueOrThrow({
      where: { id: contactId },
    })

    const conversation = await prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId,
        channelId,
        status: { in: ['new', 'open', 'pending'] },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    if (!conversation) {
      await this.completeExecution(execution.id, 'failed', 'No active conversation')
      return
    }

    let currentNodeId: string | null = startNodeId
    let steps = 0
    const history: Array<{ nodeId: string; type: string; timestamp: string }> = []

    while (currentNodeId && steps < MAX_STEPS) {
      const node = flowDef.nodes[currentNodeId]
      if (!node) break

      steps++
      history.push({
        nodeId: currentNodeId,
        type: node.type,
        timestamp: new Date().toISOString(),
      })

      await prisma.flowExecution.update({
        where: { id: execution.id },
        data: { currentNodeId, history },
      })

      const nextHandle = await this.executeNode(
        node,
        tenantId,
        contactId,
        channelId,
        conversation.id,
        contact.platformUserId,
        execution.id,
      )

      if (nextHandle === '__wait__') {
        await prisma.flowExecution.update({
          where: { id: execution.id },
          data: { status: 'waiting' },
        })
        return
      }

      currentNodeId = this.findNextNode(flowDef, currentNodeId, nextHandle)
    }

    if (steps >= MAX_STEPS) {
      await this.completeExecution(
        execution.id,
        'failed',
        `Max steps (${MAX_STEPS}) exceeded`,
      )
      return
    }

    await this.completeExecution(execution.id, 'completed')
  }

  private async executeNode(
    node: FlowNode,
    tenantId: string,
    contactId: string,
    channelId: string,
    conversationId: string,
    recipientPlatformId: string,
    executionId: string,
  ): Promise<string | null> {
    const config = node.config

    switch (node.type) {
      case 'trigger_keyword':
      case 'trigger_comment':
      case 'trigger_webhook':
      case 'trigger_schedule':
      case 'trigger_manual':
      case 'trigger_story_mention':
        return 'default'

      case 'send_text': {
        const content: NormalizedMessageContent = {
          type: 'text',
          text: this.interpolateText(config.text as string, {}),
        }
        await this.enqueueOutgoing(
          tenantId,
          channelId,
          contactId,
          conversationId,
          content,
          recipientPlatformId,
        )
        return 'default'
      }

      case 'send_image': {
        const content: NormalizedMessageContent = {
          type: 'image',
          text: config.caption as string | undefined,
          attachments: [
            {
              type: 'image',
              url: config.imageUrl as string,
              mimeType: 'image/jpeg',
            },
          ],
        }
        await this.enqueueOutgoing(
          tenantId,
          channelId,
          contactId,
          conversationId,
          content,
          recipientPlatformId,
        )
        return 'default'
      }

      case 'send_buttons': {
        const content: NormalizedMessageContent = {
          type: 'text',
          text: this.interpolateText(config.text as string, {}),
          buttons: ((config.buttons ?? []) as Array<{ title: string; payload?: string; url?: string; type?: string }>).map((btn) => ({
            type: (btn.type ?? 'postback') as 'url' | 'postback' | 'call',
            title: btn.title,
            payload: btn.payload,
            url: btn.url,
          })),
        }
        await this.enqueueOutgoing(
          tenantId,
          channelId,
          contactId,
          conversationId,
          content,
          recipientPlatformId,
        )
        return 'default'
      }

      case 'send_quick_replies': {
        const content: NormalizedMessageContent = {
          type: 'text',
          text: this.interpolateText(config.text as string, {}),
          quickReplies: (config.quickReplies as Array<{ title: string; payload: string }>) ?? [],
        }
        await this.enqueueOutgoing(
          tenantId,
          channelId,
          contactId,
          conversationId,
          content,
          recipientPlatformId,
        )
        return 'default'
      }

      case 'action_add_tag': {
        await this.contactService.addTag(
          tenantId,
          contactId,
          config.tagName as string,
        )
        return 'default'
      }

      case 'action_remove_tag': {
        await this.contactService.removeTag(
          tenantId,
          contactId,
          config.tagName as string,
        )
        return 'default'
      }

      case 'action_set_field': {
        await this.contactService.setCustomField(
          contactId,
          config.fieldKey as string,
          config.value,
        )
        return 'default'
      }

      case 'condition': {
        const result = this.evaluateCondition(config, {})
        return result ? 'yes' : 'no'
      }

      case 'smart_delay': {
        const delayMs = this.calculateDelay(
          config.duration as number,
          config.unit as string,
        )

        await this.queueService.addJob(
          QUEUE_NAMES.FLOW_EXECUTIONS,
          'resume-flow',
          {
            executionId,
            nextHandle: 'default',
          },
          { delay: delayMs },
        )
        return '__wait__'
      }

      case 'wait_for_input': {
        return '__wait__'
      }

      case 'random_split': {
        const variants = (config.variants as Array<{ weight: number }>) ?? [
          { weight: 50 },
          { weight: 50 },
        ]
        const random = Math.random() * 100
        let cumulative = 0
        for (let i = 0; i < variants.length; i++) {
          cumulative += variants[i].weight
          if (random <= cumulative) {
            return `variant_${i}`
          }
        }
        return 'variant_0'
      }

      case 'action_http_request': {
        try {
          const response = await fetch(config.url as string, {
            method: (config.method as string) ?? 'GET',
            headers: config.headers as Record<string, string> | undefined,
            body:
              config.method !== 'GET' && config.body
                ? JSON.stringify(config.body)
                : undefined,
          })

          return response.ok ? 'success' : 'failure'
        } catch {
          return 'failure'
        }
      }

      default:
        this.logger.warn(`Unknown node type: ${node.type}`)
        return 'default'
    }
  }

  private async enqueueOutgoing(
    tenantId: string,
    channelId: string,
    contactId: string,
    conversationId: string,
    content: NormalizedMessageContent,
    recipientPlatformId: string,
  ) {
    const job: OutgoingMessageJob = {
      tenantId,
      channelId,
      contactId,
      conversationId,
      content,
      recipientPlatformId,
    }

    await this.queueService.addJob(
      QUEUE_NAMES.OUTGOING_MESSAGES,
      'send-message',
      job,
    )
  }

  private findStartNode(definition: FlowDefinition): string | null {
    const nodeIds = Object.keys(definition.nodes)

    const triggerNode = nodeIds.find((id) =>
      definition.nodes[id].type.startsWith('trigger_'),
    )
    if (triggerNode) return triggerNode

    const targetIds = new Set(definition.edges.map((e) => e.target))
    const rootNode = nodeIds.find((id) => !targetIds.has(id))
    return rootNode ?? nodeIds[0] ?? null
  }

  private findNextNode(
    definition: FlowDefinition,
    currentNodeId: string,
    outputHandle: string | null,
  ): string | null {
    const handle = outputHandle ?? 'default'

    const edge = definition.edges.find(
      (e) =>
        e.source === currentNodeId &&
        (e.sourceHandle === handle || (!e.sourceHandle && handle === 'default')),
    )

    return edge?.target ?? null
  }

  private initializeVariables(
    variables?: Array<{ name: string; defaultValue: unknown }>,
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    if (!variables) return result

    for (const v of variables) {
      result[v.name] = v.defaultValue
    }
    return result
  }

  private interpolateText(
    template: string,
    context: Record<string, unknown>,
  ): string {
    if (!template) return ''

    return template.replace(
      /\{\{(\w+(?:\.\w+)*)\}\}/g,
      (_match, path: string) => {
        const parts = path.split('.')
        let value: unknown = context
        for (const part of parts) {
          if (value == null || typeof value !== 'object') return ''
          value = (value as Record<string, unknown>)[part]
        }
        return value != null ? String(value) : ''
      },
    )
  }

  private evaluateCondition(
    config: Record<string, unknown>,
    _context: Record<string, unknown>,
  ): boolean {
    const rules = (config.rules ?? []) as Array<{
      field: string
      operator: string
      value: unknown
    }>

    if (rules.length === 0) return true

    const logic = (config.logic ?? 'and') as string

    const results = rules.map((rule) => {
      const fieldValue = String(rule.value ?? '')
      switch (rule.operator) {
        case 'equals':
          return fieldValue === String(rule.value)
        case 'not_equals':
          return fieldValue !== String(rule.value)
        case 'contains':
          return fieldValue.includes(String(rule.value))
        case 'exists':
          return fieldValue !== ''
        default:
          return false
      }
    })

    return logic === 'or'
      ? results.some(Boolean)
      : results.every(Boolean)
  }

  private calculateDelay(duration: number, unit: string): number {
    switch (unit) {
      case 'seconds':
        return duration * 1000
      case 'minutes':
        return duration * 60 * 1000
      case 'hours':
        return duration * 60 * 60 * 1000
      case 'days':
        return duration * 24 * 60 * 60 * 1000
      default:
        return duration * 60 * 1000
    }
  }

  private async completeExecution(
    executionId: string,
    status: string,
    error?: string,
  ) {
    await prisma.flowExecution.update({
      where: { id: executionId },
      data: {
        status,
        completedAt: new Date(),
        error,
      },
    })
  }
}
