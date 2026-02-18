import { Injectable } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import type { NormalizedIncomingMessage, NormalizedMessageContent } from '@flowchat/shared'

@Injectable()
export class MessageService {
  async storeIncoming(
    tenantId: string,
    conversationId: string,
    contactId: string,
    normalized: NormalizedIncomingMessage,
  ) {
    return prisma.message.create({
      data: {
        tenantId,
        conversationId,
        contactId,
        direction: 'inbound',
        content: normalized.content as object,
        platformMessageId: normalized.platformMessageId,
        status: 'received',
      },
    })
  }

  async storeOutgoing(
    tenantId: string,
    conversationId: string,
    content: NormalizedMessageContent,
    platformMessageId?: string,
    status: string = 'sent',
  ) {
    return prisma.message.create({
      data: {
        tenantId,
        conversationId,
        direction: 'outbound',
        content: content as unknown as object,
        platformMessageId,
        status,
      },
    })
  }

  async updateStatus(messageId: string, status: string, errorMessage?: string) {
    await prisma.message.update({
      where: { id: messageId },
      data: { status, errorMessage },
    })
  }
}
