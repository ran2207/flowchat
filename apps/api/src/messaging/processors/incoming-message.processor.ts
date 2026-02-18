import { Injectable, OnModuleInit, OnModuleDestroy, Inject, Logger } from '@nestjs/common'
import { Worker, type Job, type ConnectionOptions } from 'bullmq'
import type { NormalizedIncomingMessage } from '@flowchat/shared'
import { QUEUE_NAMES } from '../../queue'
import { ContactService } from '../services/contact.service'
import { ConversationService } from '../services/conversation.service'
import { MessageService } from '../services/message.service'
import { FlowTriggerService } from '../services/flow-trigger.service'
import type { IncomingWebhookJob } from '../../webhooks/webhooks.service'

@Injectable()
export class IncomingMessageProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IncomingMessageProcessor.name)
  private worker: Worker | null = null

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redisConnection: ConnectionOptions,
    private readonly contactService: ContactService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly flowTriggerService: FlowTriggerService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      QUEUE_NAMES.INCOMING_MESSAGES,
      async (job: Job<IncomingWebhookJob>) => this.process(job),
      {
        connection: this.redisConnection,
        concurrency: 10,
      },
    )

    this.worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed`)
    })

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Job ${job?.id} failed: ${err.message}`,
        err.stack,
      )
    })

    this.logger.log('Incoming message processor started')
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close()
      this.logger.log('Incoming message processor stopped')
    }
  }

  private async process(job: Job<IncomingWebhookJob>): Promise<void> {
    const { tenantId, channelId, platform, normalizedMessage } = job.data

    const message = normalizedMessage as unknown as NormalizedIncomingMessage

    const contact = await this.contactService.findOrCreate(
      tenantId,
      channelId,
      platform,
      message.senderId,
    )

    const conversation = await this.conversationService.findOrCreateForContact(
      tenantId,
      contact.id,
      channelId,
    )

    await this.messageService.storeIncoming(
      tenantId,
      conversation.id,
      contact.id,
      message,
    )

    const preview =
      message.content.text ?? `[${message.content.type}]`

    await this.conversationService.updateLastMessage(
      conversation.id,
      preview,
      'inbound',
    )

    await this.flowTriggerService.matchAndTrigger(
      tenantId,
      contact.id,
      channelId,
      message,
    )
  }
}
