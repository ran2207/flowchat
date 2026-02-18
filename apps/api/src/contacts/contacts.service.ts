import { Injectable, NotFoundException } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import { ListContactsDto } from './dto/list-contacts.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { BulkActionDto } from './dto/bulk-action.dto'

@Injectable()
export class ContactsService {
  async findAll(tenantId: string, dto: ListContactsDto) {
    const page = dto.page ?? 1
    const limit = dto.limit ?? 25
    const skip = (page - 1) * limit
    const sortBy = dto.sortBy ?? 'lastInteractionAt'
    const sortOrder = dto.sortOrder ?? 'desc'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId, deletedAt: null }

    if (dto.search) {
      where.OR = [
        { firstName: { contains: dto.search, mode: 'insensitive' } },
        { lastName: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
        { phone: { contains: dto.search } },
        { platformUserId: { contains: dto.search } },
      ]
    }

    if (dto.platform) {
      where.platform = dto.platform
    }

    if (dto.subscriptionStatus === 'subscribed') {
      where.isSubscribed = true
    } else if (dto.subscriptionStatus === 'unsubscribed') {
      where.isSubscribed = false
    }

    if (dto.tags?.length) {
      where.contactTags = {
        some: {
          tag: {
            name: { in: dto.tags },
            tenantId,
          },
        },
      }
    }

    const orderBy: Record<string, string> = {}
    const allowedSorts = [
      'createdAt',
      'lastInteractionAt',
      'firstName',
      'lastName',
      'email',
    ]

    if (allowedSorts.includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.lastInteractionAt = 'desc'
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          platform: true,
          platformUserId: true,
          isSubscribed: true,
          lastInteractionAt: true,
          createdAt: true,
          contactTags: {
            select: {
              tag: { select: { id: true, name: true, color: true } },
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ])

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formatted = contacts.map((c: any) => ({
      ...c,
      tags: c.contactTags.map((ct: { tag: { id: string; name: string; color: string | null } }) => ct.tag),
      contactTags: undefined,
    }))

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async findOne(tenantId: string, contactId: string) {
    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId, deletedAt: null },
      include: {
        contactTags: {
          select: {
            tag: { select: { id: true, name: true, color: true } },
          },
        },
        conversations: {
          orderBy: { lastMessageAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            lastMessageAt: true,
            lastMessagePreview: true,
            channel: { select: { id: true, platform: true, name: true } },
          },
        },
        flowExecutions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            status: true,
            startedAt: true,
            completedAt: true,
            flow: { select: { id: true, name: true } },
          },
        },
      },
    })

    if (!contact) {
      throw new NotFoundException('Contact not found')
    }

    return {
      ...contact,
      tags: contact.contactTags.map((ct: { tag: { id: string; name: string; color: string | null } }) => ct.tag),
      contactTags: undefined,
    }
  }

  async update(tenantId: string, contactId: string, dto: UpdateContactDto) {
    await this.findOne(tenantId, contactId)

    const data: Record<string, unknown> = {}

    if (dto.firstName !== undefined) data.firstName = dto.firstName
    if (dto.lastName !== undefined) data.lastName = dto.lastName
    if (dto.email !== undefined) data.email = dto.email
    if (dto.phone !== undefined) data.phone = dto.phone
    if (dto.timezone !== undefined) data.timezone = dto.timezone

    if (dto.customFields) {
      const current = await prisma.contact.findUniqueOrThrow({
        where: { id: contactId },
        select: { customFields: true },
      })
      const merged = {
        ...(current.customFields as Record<string, unknown>),
        ...dto.customFields,
      }
      data.customFields = merged
    }

    return prisma.contact.update({
      where: { id: contactId },
      data,
    })
  }

  async addTags(tenantId: string, contactId: string, tagNames: string[]) {
    await this.findOne(tenantId, contactId)

    for (const name of tagNames) {
      const tag = await prisma.tag.upsert({
        where: { tenantId_name: { tenantId, name } },
        update: {},
        create: { tenantId, name },
      })

      await prisma.contactTag.upsert({
        where: { contactId_tagId: { contactId, tagId: tag.id } },
        update: {},
        create: { contactId, tagId: tag.id },
      })
    }
  }

  async removeTags(tenantId: string, contactId: string, tagNames: string[]) {
    await this.findOne(tenantId, contactId)

    const tags = await prisma.tag.findMany({
      where: { tenantId, name: { in: tagNames } },
    })

    if (tags.length > 0) {
      await prisma.contactTag.deleteMany({
        where: {
          contactId,
          tagId: { in: tags.map((t: { id: string }) => t.id) },
        },
      })
    }
  }

  async bulkAction(tenantId: string, dto: BulkActionDto) {
    const contacts = await prisma.contact.findMany({
      where: { id: { in: dto.contactIds }, tenantId },
      select: { id: true },
    })

    const validIds = contacts.map((c: { id: string }) => c.id)
    let affected = 0

    switch (dto.action) {
      case 'add_tag': {
        if (!dto.tagName) break
        for (const contactId of validIds) {
          await this.addTags(tenantId, contactId, [dto.tagName])
          affected++
        }
        break
      }
      case 'remove_tag': {
        if (!dto.tagName) break
        for (const contactId of validIds) {
          await this.removeTags(tenantId, contactId, [dto.tagName])
          affected++
        }
        break
      }
      case 'subscribe': {
        const result = await prisma.contact.updateMany({
          where: { id: { in: validIds } },
          data: { isSubscribed: true, subscribedAt: new Date() },
        })
        affected = result.count
        break
      }
      case 'unsubscribe': {
        const result = await prisma.contact.updateMany({
          where: { id: { in: validIds } },
          data: { isSubscribed: false, unsubscribedAt: new Date() },
        })
        affected = result.count
        break
      }
      case 'delete': {
        const result = await prisma.contact.updateMany({
          where: { id: { in: validIds } },
          data: { deletedAt: new Date() },
        })
        affected = result.count
        break
      }
    }

    return { affected, action: dto.action }
  }

  async exportCsv(tenantId: string) {
    const contacts = await prisma.contact.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        contactTags: {
          select: { tag: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const headers = [
      'id',
      'firstName',
      'lastName',
      'email',
      'phone',
      'platform',
      'platformUserId',
      'isSubscribed',
      'tags',
      'createdAt',
    ]

    const rows = contacts.map((c: typeof contacts[number]) => [
      c.id,
      c.firstName ?? '',
      c.lastName ?? '',
      c.email ?? '',
      c.phone ?? '',
      c.platform,
      c.platformUserId,
      String(c.isSubscribed),
      c.contactTags.map((ct: { tag: { name: string } }) => ct.tag.name).join(';'),
      c.createdAt.toISOString(),
    ])

    return [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\n')
  }
}
