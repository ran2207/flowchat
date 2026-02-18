import { Injectable, Logger } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import {
  TelegramAdapter,
  type PlatformAdapter,
  type ChannelCredentials,
} from '@flowchat/platform-adapters'
import { QueueService, QUEUE_NAMES } from '../queue'

export interface IncomingWebhookJob {
  channelId: string
  tenantId: string
  platform: string
  normalizedMessage: Record<string, unknown>
  rawPayload: unknown
  receivedAt: string
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)
  private readonly adapters = new Map<string, PlatformAdapter>()

  constructor(private readonly queueService: QueueService) {
    this.adapters.set('telegram', new TelegramAdapter())
  }

  async handleIncomingWebhook(
    platform: string,
    channelId: string,
    headers: Record<string, string>,
    rawBody: string,
    parsedBody: unknown,
  ): Promise<void> {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, platform, status: 'active' },
    })

    if (!channel) {
      this.logger.warn(
        `Webhook received for unknown/inactive channel: ${channelId} (${platform})`,
      )
      return
    }

    const adapter = this.adapters.get(platform)
    if (!adapter) {
      this.logger.warn(`No adapter registered for platform: ${platform}`)
      return
    }

    if (channel.webhookSecret) {
      const isValid = adapter.verifyWebhook(
        headers,
        rawBody,
        channel.webhookSecret,
      )
      if (!isValid) {
        this.logger.warn(
          `Invalid webhook signature for channel ${channelId} (${platform})`,
        )
        return
      }
    }

    const normalizedMessage = adapter.normalizeIncoming(parsedBody)

    const job: IncomingWebhookJob = {
      channelId: channel.id,
      tenantId: channel.tenantId,
      platform,
      normalizedMessage: normalizedMessage as unknown as Record<string, unknown>,
      rawPayload: parsedBody,
      receivedAt: new Date().toISOString(),
    }

    await this.queueService.addJob(
      QUEUE_NAMES.INCOMING_MESSAGES,
      `${platform}-message`,
      job,
    )

    this.logger.debug(
      `Enqueued incoming ${platform} message for channel ${channelId}`,
    )
  }

  getAdapter(platform: string): PlatformAdapter | undefined {
    return this.adapters.get(platform)
  }

  getCredentials(channel: { credentials: unknown }): ChannelCredentials {
    const creds = channel.credentials as Record<string, unknown>
    return {
      accessToken: (creds.botToken ?? creds.accessToken ?? '') as string,
      ...creds,
    }
  }
}
