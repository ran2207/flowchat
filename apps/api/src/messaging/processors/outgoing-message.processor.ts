import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common'
import { Worker, type Job, type ConnectionOptions } from 'bullmq'
import type { NormalizedMessageContent } from '@flowchat/shared'
import { prisma } from '@flowchat/database'
import { QUEUE_NAMES } from '../../queue'
import { WebhooksService } from '../../webhooks/webhooks.service'
import { ConversationService } from '../services/conversation.service'
import { MessageService } from '../services/message.service'

export interface OutgoingMessageJob {
  tenantId: string
  channelId: string
  contactId: string
  conversationId: string
  content: NormalizedMessageContent
  recipientPlatformId: string
}

@Injectable()
export class OutgoingMessageProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutgoingMessageProcessor.name)
  private worker: Worker | null = null

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redisConnection: ConnectionOptions,
    private readonly webhooksService: WebhooksService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE_NAMES.OUTGOING_MESSAGES,
      async (job: Job<OutgoingMessageJob>) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 5,
        limiter: {
          max: 25,
          duration: 1000,
        },
      },
    )

    this.worker.on('completed', (job) => {
      this.logger.debug(`Outgoing job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Outgoing job ${job?.id} failed: ${err.message}`,
        err.stack,
      )
    })

    this.logger.log('Outgoing message processor started')
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close()
      this.logger.log('Outgoing message processor stopped')
    }
  }

  private async process(job: Job<OutgoingMessageJob>): Promise<void> {
    const {
      tenantId,
      channelId,
      conversationId,
      content,
      recipientPlatformId,
    } = job.data

    const channel = await prisma.channel.findFirstOrThrow({
      where: { id: channelId },
    })

    const adapter = this.webhooksService.getAdapter(channel.platform)
    if (!adapter) {
      throw new Error(`No adapter for platform: ${channel.platform}`)
    }

    const credentials = this.webhooksService.getCredentials(channel)
    const payload = adapter.buildOutgoing(content, recipientPlatformId)
    const result = await adapter.send(payload, credentials)

    const message = await this.messageService.storeOutgoing(
      tenantId,
      conversationId,
      content,
      result.platformMessageId,
      result.status,
    )

    if (result.status === 'failed') {
      await this.messageService.updateStatus(
        message.id,
        'failed',
        result.error,
      )
      this.logger.warn(
        `Message send failed for channel ${channelId}: ${result.error}`,
      )
      return
    }

    const preview = content.text ?? `[${content.type ?? 'message'}]`
    await this.conversationService.updateLastMessage(
      conversationId,
      preview,
      'outbound',
    )
  }
}
