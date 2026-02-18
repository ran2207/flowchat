import { Injectable, NotFoundException } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import type { NormalizedMessageContent } from '@flowchat/shared'
import { ListConversationsDto } from './dto/list-conversations.dto'
import { QueueService, QUEUE_NAMES } from '../queue'
import type { OutgoingMessageJob } from '../messaging/processors/outgoing-message.processor'

@Injectable()
export class ConversationsService {
  constructor(private readonly queueService: QueueService) {}

  async findAll(tenantId: string, userId: string, dto: ListConversationsDto) {
    const page = dto.page ?? 1
    const limit = dto.limit ?? 25
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = { tenantId }

    if (dto.status) {
      where.status = dto.status
    } else {
      where.status = { in: ['new', 'open', 'pending'] }
    }

    if (dto.assignment === 'me') {
      where.assignedAgentId = userId
    } else if (dto.assignment === 'unassigned') {
      where.assignedAgentId = null
    } else if (dto.assignedTo) {
      where.assignedAgentId = dto.assignedTo
    }

    if (dto.channelId) {
      where.channelId = dto.channelId
    }

    if (dto.search) {
      where.OR = [
        { lastMessagePreview: { contains: dto.search, mode: 'insensitive' } },
        {
          contact: {
            OR: [
              { firstName: { contains: dto.search, mode: 'insensitive' } },
              { lastName: { contains: dto.search, mode: 'insensitive' } },
              { email: { contains: dto.search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy: { lastMessageAt: { sort: 'desc', nulls: 'last' } },
        skip,
        take: limit,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
              platform: true,
              platformUserId: true,
            },
          },
          channel: {
            select: {
              id: true,
              platform: true,
              name: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ])

    return {
      data: conversations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(tenantId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            platform: true,
            platformUserId: true,
            customFields: true,
            isSubscribed: true,
            lastInteractionAt: true,
            createdAt: true,
          },
        },
        channel: {
          select: {
            id: true,
            platform: true,
            name: true,
          },
        },
        assignedAgent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!conversation) {
      throw new NotFoundException('Conversation not found')
    }

    return conversation
  }

  async getMessages(
    tenantId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    await this.findOne(tenantId, conversationId)

    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId, tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          direction: true,
          content: true,
          platformMessageId: true,
          status: true,
          metadata: true,
          createdAt: true,
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.message.count({ where: { conversationId, tenantId } }),
    ])

    return {
      data: messages.reverse(),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async sendMessage(
    tenantId: string,
    userId: string,
    conversationId: string,
    text: string,
    isNote: boolean = false,
  ) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId },
      include: {
        contact: { select: { id: true, platformUserId: true } },
        channel: { select: { id: true } },
      },
    })

    if (!conversation) {
      throw new NotFoundException('Conversation not found')
    }

    if (isNote) {
      const note = await prisma.message.create({
        data: {
          tenantId,
          conversationId,
          agentId: userId,
          direction: 'outbound',
          content: { type: 'text', text },
          status: 'delivered',
          metadata: { isNote: true },
        },
      })

      return note
    }

    const message = await prisma.message.create({
      data: {
        tenantId,
        conversationId,
        agentId: userId,
        direction: 'outbound',
        content: { type: 'text', text },
        status: 'sending',
      },
    })

    const content: NormalizedMessageContent = { type: 'text', text }

    const job: OutgoingMessageJob = {
      tenantId,
      channelId: conversation.channel.id,
      contactId: conversation.contact.id,
      conversationId,
      content,
      recipientPlatformId: conversation.contact.platformUserId,
    }

    await this.queueService.addJob(
      QUEUE_NAMES.OUTGOING_MESSAGES,
      'agent-message',
      job,
    )

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: text.slice(0, 255),
        status: conversation.status === 'new' ? 'open' : conversation.status,
      },
    })

    return message
  }

  async assignAgent(
    tenantId: string,
    conversationId: string,
    agentId: string | null,
  ) {
    await this.findOne(tenantId, conversationId)

    if (agentId) {
      const agent = await prisma.user.findFirst({
        where: { id: agentId, tenantId },
      })
      if (!agent) {
        throw new NotFoundException('Agent not found')
      }
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedAgentId: agentId,
        status: agentId ? 'open' : undefined,
      },
    })
  }

  async updateStatus(
    tenantId: string,
    conversationId: string,
    status: string,
  ) {
    await this.findOne(tenantId, conversationId)

    const data: Record<string, unknown> = { status }

    if (status === 'resolved') {
      data.resolvedAt = new Date()
    } else if (status === 'closed') {
      data.closedAt = new Date()
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data,
    })
  }

  async markRead(tenantId: string, conversationId: string) {
    await this.findOne(tenantId, conversationId)

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    })
  }
}
