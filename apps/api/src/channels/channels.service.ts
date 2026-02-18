import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common'
import { randomBytes } from 'node:crypto'
import { prisma } from '@flowchat/database'
import { CreateChannelDto } from './dto/create-channel.dto'
import { UpdateChannelDto } from './dto/update-channel.dto'

@Injectable()
export class ChannelsService {
  private readonly logger = new Logger(ChannelsService.name)

  async findAll(tenantId: string) {
    return prisma.channel.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        platformAccountId: true,
        name: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findOne(tenantId: string, channelId: string) {
    const channel = await prisma.channel.findFirst({
      where: { id: channelId, tenantId },
    })

    if (!channel) {
      throw new NotFoundException('Channel not found')
    }

    return channel
  }

  async findByPlatformAndAccount(platform: string, platformAccountId: string) {
    return prisma.channel.findFirst({
      where: { platform, platformAccountId, status: 'active' },
    })
  }

  async create(tenantId: string, dto: CreateChannelDto) {
    const platformAccountId = this.extractPlatformAccountId(
      dto.platform,
      dto.credentials,
    )

    const existing = await prisma.channel.findFirst({
      where: { tenantId, platform: dto.platform, platformAccountId },
    })

    if (existing) {
      throw new ConflictException(
        `A ${dto.platform} channel with this account is already connected`,
      )
    }

    const webhookSecret = randomBytes(32).toString('hex')

    const channel = await prisma.channel.create({
      data: {
        tenantId,
        platform: dto.platform,
        platformAccountId,
        name: dto.name,
        credentials: dto.credentials as object,
        webhookSecret,
        settings: (dto.settings ?? {}) as object,
      },
    })

    this.logger.log(
      `Channel created: ${channel.id} (${dto.platform}) for tenant ${tenantId}`,
    )

    return channel
  }

  async update(tenantId: string, channelId: string, dto: UpdateChannelDto) {
    await this.findOne(tenantId, channelId)

    const data: Record<string, unknown> = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.credentials !== undefined) data.credentials = dto.credentials
    if (dto.settings !== undefined) data.settings = dto.settings

    return prisma.channel.update({
      where: { id: channelId },
      data,
    })
  }

  async remove(tenantId: string, channelId: string) {
    await this.findOne(tenantId, channelId)

    return prisma.channel.update({
      where: { id: channelId },
      data: { status: 'disconnected' },
    })
  }

  async setupTelegramWebhook(
    channelId: string,
    botToken: string,
    webhookUrl: string,
    webhookSecret: string,
  ): Promise<boolean> {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: `${webhookUrl}/api/webhooks/telegram/${channelId}`,
        secret_token: webhookSecret,
        allowed_updates: [
          'message',
          'callback_query',
          'edited_message',
        ],
      }),
    })

    const data = (await response.json()) as { ok: boolean; description?: string }

    if (!data.ok) {
      this.logger.error(`Failed to set Telegram webhook: ${data.description}`)
      return false
    }

    this.logger.log(`Telegram webhook set for channel ${channelId}`)
    return true
  }

  private extractPlatformAccountId(
    platform: string,
    credentials: Record<string, unknown>,
  ): string {
    switch (platform) {
      case 'telegram': {
        const token = credentials.botToken as string
        return token.split(':')[0]
      }
      default:
        return credentials.accountId as string ?? 'unknown'
    }
  }
}
