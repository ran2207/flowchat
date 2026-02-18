import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import { QueueService, QUEUE_NAMES } from '../queue/queue.service'

interface BroadcastStats {
  total: number
  sent: number
  delivered: number
  failed: number
}

interface AudienceFilter {
  tags?: string[]
  platforms?: string[]
  isSubscribed?: boolean
  customFields?: Array<{ key: string; operator: string; value: string }>
}

@Injectable()
export class BroadcastsService {
  private readonly logger = new Logger(BroadcastsService.name)

  constructor(private readonly queueService: QueueService) {}

  async create(
    tenantId: string,
    data: {
      name: string
      channelId?: string
      content: Record<string, unknown>
      audienceFilter?: AudienceFilter
      scheduledAt?: Date
      createdById?: string
    },
  ) {
    const broadcast = await prisma.broadcast.create({
      data: {
        tenantId,
        name: data.name,
        channelId: data.channelId ?? null,
        content: data.content as object,
        audienceFilter: (data.audienceFilter ?? {}) as object,
        scheduledAt: data.scheduledAt ?? null,
        createdById: data.createdById ?? null,
        status: data.scheduledAt ? 'scheduled' : 'draft',
      },
    })

    if (data.scheduledAt) {
      const delay = data.scheduledAt.getTime() - Date.now()
      if (delay > 0) {
        await this.queueService.addJob(
          QUEUE_NAMES.SCHEDULED_MESSAGES,
          'broadcast:execute',
          { broadcastId: broadcast.id, tenantId },
          { delay },
        )
      }
    }

    return broadcast
  }

  async findAll(
    tenantId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ) {
    const { status, page = 1, limit = 20 } = options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId }
    if (status) where.status = status

    const [broadcasts, total] = await Promise.all([
      prisma.broadcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          channel: { select: { id: true, name: true, platform: true } },
          createdBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.broadcast.count({ where }),
    ])

    return { broadcasts, total, page, limit }
  }

  async findOne(tenantId: string, id: string) {
    const broadcast = await prisma.broadcast.findFirst({
      where: { id, tenantId },
      include: {
        channel: { select: { id: true, name: true, platform: true } },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    })

    if (!broadcast) throw new NotFoundException('Broadcast not found')
    return broadcast
  }

  async update(
    tenantId: string,
    id: string,
    data: {
      name?: string
      channelId?: string
      content?: Record<string, unknown>
      audienceFilter?: AudienceFilter
      scheduledAt?: Date | null
    },
  ) {
    await this.findOne(tenantId, id)

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.channelId !== undefined) updateData.channelId = data.channelId
    if (data.content !== undefined) updateData.content = data.content
    if (data.audienceFilter !== undefined)
      updateData.audienceFilter = data.audienceFilter as Record<string, unknown>
    if (data.scheduledAt !== undefined) {
      updateData.scheduledAt = data.scheduledAt
      updateData.status = data.scheduledAt ? 'scheduled' : 'draft'
    }

    return prisma.broadcast.update({ where: { id }, data: updateData })
  }

  async delete(tenantId: string, id: string) {
    const broadcast = await this.findOne(tenantId, id)
    if (broadcast.status === 'sending') {
      throw new Error('Cannot delete a broadcast that is currently sending')
    }
    await prisma.broadcast.delete({ where: { id } })
  }

  async send(tenantId: string, id: string) {
    const broadcast = await this.findOne(tenantId, id)
    if (broadcast.status === 'sending' || broadcast.status === 'completed') {
      throw new Error(`Broadcast is already ${broadcast.status}`)
    }

    await prisma.broadcast.update({
      where: { id },
      data: { status: 'sending', startedAt: new Date() },
    })

    await this.queueService.addJob(
      QUEUE_NAMES.SCHEDULED_MESSAGES,
      'broadcast:execute',
      { broadcastId: id, tenantId },
    )

    return { status: 'sending' }
  }

  async getAudienceCount(tenantId: string, filter: AudienceFilter): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId, isSubscribed: true, deletedAt: null }

    if (filter.platforms?.length) {
      where.platform = { in: filter.platforms }
    }

    if (filter.tags?.length) {
      where.contactTags = {
        some: { tag: { name: { in: filter.tags } } },
      }
    }

    return prisma.contact.count({ where })
  }

  async executeBroadcast(broadcastId: string, tenantId: string): Promise<void> {
    const broadcast = await this.findOne(tenantId, broadcastId)
    const filter = broadcast.audienceFilter as unknown as AudienceFilter

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId, isSubscribed: true, deletedAt: null }
    if (filter.platforms?.length) {
      where.platform = { in: filter.platforms }
    }
    if (filter.tags?.length) {
      where.contactTags = {
        some: { tag: { name: { in: filter.tags } } },
      }
    }
    if (broadcast.channelId) {
      where.channelId = broadcast.channelId
    }

    const contacts = await prisma.contact.findMany({
      where,
      select: { id: true, platform: true, platformUserId: true, channelId: true },
    })

    const stats: BroadcastStats = {
      total: contacts.length,
      sent: 0,
      delivered: 0,
      failed: 0,
    }

    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { stats: stats as unknown as object },
    })

    const content = broadcast.content as Record<string, unknown>

    for (const contact of contacts) {
      try {
        await this.queueService.addJob(
          QUEUE_NAMES.OUTGOING_MESSAGES,
          'broadcast:message',
          {
            tenantId,
            broadcastId,
            contactId: contact.id,
            channelId: contact.channelId ?? broadcast.channelId,
            platformUserId: contact.platformUserId,
            content,
          },
        )
        stats.sent++
      } catch (error) {
        this.logger.error(
          `Failed to enqueue broadcast message: ${error instanceof Error ? error.message : String(error)}`,
        )
        stats.failed++
      }
    }

    const finalStatus = stats.failed === stats.total ? 'failed' : 'completed'
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        stats: stats as unknown as object,
      },
    })

    this.logger.log(
      `Broadcast ${broadcastId} completed: ${stats.sent}/${stats.total} sent, ${stats.failed} failed`,
    )
  }
}
