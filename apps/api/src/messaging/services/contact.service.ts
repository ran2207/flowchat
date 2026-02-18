import { Injectable, Logger } from '@nestjs/common'
import { prisma } from '@flowchat/database'

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name)

  async findOrCreate(
    tenantId: string,
    channelId: string,
    platform: string,
    platformUserId: string,
  ) {
    const existing = await prisma.contact.findFirst({
      where: { tenantId, platform, platformUserId },
    })

    if (existing) {
      await prisma.contact.update({
        where: { id: existing.id },
        data: { lastInteractionAt: new Date() },
      })
      return existing
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        channelId,
        platform,
        platformUserId,
        isSubscribed: true,
        subscribedAt: new Date(),
        lastInteractionAt: new Date(),
      },
    })

    this.logger.log(
      `New contact created: ${contact.id} (${platform}:${platformUserId})`,
    )

    return contact
  }

  async updateProfile(
    contactId: string,
    data: {
      firstName?: string
      lastName?: string
      avatarUrl?: string
      locale?: string
    },
  ) {
    const updateData: Record<string, unknown> = {}
    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl
    if (data.locale !== undefined) updateData.locale = data.locale

    if (Object.keys(updateData).length === 0) return

    await prisma.contact.update({
      where: { id: contactId },
      data: updateData,
    })
  }

  async addTag(tenantId: string, contactId: string, tagName: string) {
    const tag = await prisma.tag.upsert({
      where: {
        tenantId_name: { tenantId, name: tagName },
      },
      update: {},
      create: { tenantId, name: tagName },
    })

    await prisma.contactTag.upsert({
      where: {
        contactId_tagId: { contactId, tagId: tag.id },
      },
      update: {},
      create: { contactId, tagId: tag.id },
    })
  }

  async removeTag(tenantId: string, contactId: string, tagName: string) {
    const tag = await prisma.tag.findFirst({
      where: { tenantId, name: tagName },
    })

    if (!tag) return

    await prisma.contactTag.deleteMany({
      where: { contactId, tagId: tag.id },
    })
  }

  async setCustomField(
    contactId: string,
    fieldKey: string,
    value: unknown,
  ) {
    const contact = await prisma.contact.findUniqueOrThrow({
      where: { id: contactId },
      select: { customFields: true },
    })

    const fields = contact.customFields as Record<string, unknown>
    fields[fieldKey] = value

    await prisma.contact.update({
      where: { id: contactId },
      data: { customFields: fields as object },
    })
  }
}
