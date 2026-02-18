import { Injectable, Logger } from '@nestjs/common'
import { prisma } from '@flowchat/database'

@Injectable()
export class ConversationService {
  private readonly logger = new Logger(ConversationService.name)

  async findOrCreateForContact(
    tenantId: string,
    contactId: string,
    channelId: string,
  ) {
    const openConversation = await prisma.conversation.findFirst({
      where: {
        tenantId,
        contactId,
        channelId,
        status: { in: ['new', 'open', 'pending'] },
      },
      orderBy: { lastMessageAt: 'desc' },
    })

    if (openConversation) {
      return openConversation
    }

    const conversation = await prisma.conversation.create({
      data: {
        tenantId,
        contactId,
        channelId,
        status: 'new',
        openedAt: new Date(),
      },
    })

    this.logger.log(
      `New conversation created: ${conversation.id} for contact ${contactId}`,
    )

    return conversation
  }

  async updateLastMessage(
    conversationId: string,
    preview: string,
    direction: 'inbound' | 'outbound',
  ) {
    const updateData: Record<string, unknown> = {
      lastMessageAt: new Date(),
      lastMessagePreview: preview.slice(0, 255),
    }

    if (direction === 'inbound') {
      updateData.unreadCount = { increment: 1 }
    }

    await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
    })
  }
}
