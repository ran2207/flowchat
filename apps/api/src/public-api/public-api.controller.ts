import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsIn, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'
import { Request } from 'express'
import { prisma } from '@flowchat/database'
import { ApiKeyGuard } from './api-key.guard'

interface ApiKeyPayload {
  tenantId: string
  permissions: string[]
  rateLimit: number
}

class SendMessageDto {
  @IsString()
  contactId!: string

  @IsString()
  channelId!: string

  @IsString()
  text!: string
}

class TriggerFlowDto {
  @IsString()
  flowId!: string

  @IsString()
  contactId!: string
}

class CreateContactDto {
  @IsString()
  platform!: string

  @IsString()
  platformUserId!: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string
}

class UpdateContactDto {
  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  phone?: string
}

class ManageTagsDto {
  @IsArray()
  @IsString({ each: true })
  tags!: string[]
}

class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number

  @IsOptional()
  @IsString()
  @IsIn(['active', 'draft', 'archived'])
  status?: string
}

@ApiTags('Public API')
@ApiHeader({ name: 'X-API-Key', required: true })
@UseGuards(ApiKeyGuard)
@Controller('v1')
export class PublicApiController {
  private getTenantId(req: Request): string {
    return ((req as unknown as Record<string, unknown>)['apiKeyData'] as ApiKeyPayload).tenantId
  }

  // ─── Contacts ──────────────────────────────────────────────

  @Get('contacts')
  @ApiOperation({ summary: 'List contacts' })
  async listContacts(@Req() req: Request, @Query() query: ListQueryDto) {
    const tenantId = this.getTenantId(req)
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 25, 100)

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where: { tenantId, deletedAt: null },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          platform: true,
          platformUserId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          isSubscribed: true,
          customFields: true,
          createdAt: true,
        },
      }),
      prisma.contact.count({ where: { tenantId, deletedAt: null } }),
    ])

    return { data: contacts, total, page, limit }
  }

  @Get('contacts/:id')
  @ApiOperation({ summary: 'Get a contact' })
  async getContact(@Req() req: Request, @Param('id') id: string) {
    const tenantId = this.getTenantId(req)

    const contact = await prisma.contact.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contactTags: { include: { tag: { select: { name: true } } } },
      },
    })

    if (!contact) return { error: 'Contact not found' }

    return {
      data: {
        ...contact,
        tags: contact.contactTags.map((ct: { tag: { name: string } }) => ct.tag.name),
        contactTags: undefined,
      },
    }
  }

  @Post('contacts')
  @ApiOperation({ summary: 'Create a contact' })
  async createContact(@Req() req: Request, @Body() dto: CreateContactDto) {
    const tenantId = this.getTenantId(req)

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        platform: dto.platform,
        platformUserId: dto.platformUserId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
      },
    })

    return { data: contact }
  }

  @Patch('contacts/:id')
  @ApiOperation({ summary: 'Update a contact' })
  async updateContact(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateContactDto,
  ) {
    const tenantId = this.getTenantId(req)

    const contact = await prisma.contact.updateMany({
      where: { id, tenantId, deletedAt: null },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
      },
    })

    if (contact.count === 0) return { error: 'Contact not found' }

    return { data: { updated: true } }
  }

  @Post('contacts/:id/tags')
  @ApiOperation({ summary: 'Add tags to a contact' })
  async addTags(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ManageTagsDto,
  ) {
    const tenantId = this.getTenantId(req)

    for (const tagName of dto.tags) {
      const tag = await prisma.tag.upsert({
        where: { tenantId_name: { tenantId, name: tagName } },
        create: { tenantId, name: tagName },
        update: {},
      })

      await prisma.contactTag.upsert({
        where: { contactId_tagId: { contactId: id, tagId: tag.id } },
        create: { contactId: id, tagId: tag.id },
        update: {},
      })
    }

    return { data: { tagged: true } }
  }

  @Delete('contacts/:id/tags')
  @ApiOperation({ summary: 'Remove tags from a contact' })
  async removeTags(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: ManageTagsDto,
  ) {
    const tenantId = this.getTenantId(req)

    const tags = await prisma.tag.findMany({
      where: { tenantId, name: { in: dto.tags } },
      select: { id: true },
    })

    await prisma.contactTag.deleteMany({
      where: {
        contactId: id,
        tagId: { in: tags.map((t: { id: string }) => t.id) },
      },
    })

    return { data: { removed: true } }
  }

  // ─── Flows ─────────────────────────────────────────────────

  @Get('flows')
  @ApiOperation({ summary: 'List flows' })
  async listFlows(@Req() req: Request, @Query() query: ListQueryDto) {
    const tenantId = this.getTenantId(req)
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 25, 100)

    const where: Record<string, unknown> = { tenantId, deletedAt: null }
    if (query.status) where.status = query.status

    const [flows, total] = await Promise.all([
      prisma.flow.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          triggerType: true,
          stats: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.flow.count({ where }),
    ])

    return { data: flows, total, page, limit }
  }

  @Post('flows/:id/trigger')
  @ApiOperation({ summary: 'Trigger a flow for a contact' })
  async triggerFlow(@Req() req: Request, @Body() dto: TriggerFlowDto) {
    const tenantId = this.getTenantId(req)

    const flow = await prisma.flow.findFirst({
      where: { id: dto.flowId, tenantId, status: 'active', deletedAt: null },
    })

    if (!flow) return { error: 'Flow not found or not active' }

    const execution = await prisma.flowExecution.create({
      data: {
        tenantId,
        flowId: dto.flowId,
        contactId: dto.contactId,
        flowVersion: flow.currentVersion,
        status: 'running',
      },
    })

    return { data: { executionId: execution.id, status: 'triggered' } }
  }

  // ─── Messages ──────────────────────────────────────────────

  @Post('messages/send')
  @ApiOperation({ summary: 'Send a message to a contact' })
  async sendMessage(@Req() req: Request, @Body() dto: SendMessageDto) {
    const tenantId = this.getTenantId(req)

    const contact = await prisma.contact.findFirst({
      where: { id: dto.contactId, tenantId, deletedAt: null },
    })

    if (!contact) return { error: 'Contact not found' }

    let conversation = await prisma.conversation.findFirst({
      where: { tenantId, contactId: dto.contactId, channelId: dto.channelId },
      orderBy: { createdAt: 'desc' },
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          tenantId,
          contactId: dto.contactId,
          channelId: dto.channelId,
          status: 'open',
        },
      })
    }

    const message = await prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        contactId: dto.contactId,
        direction: 'outgoing',
        content: { type: 'text', text: dto.text },
        status: 'queued',
      },
    })

    return { data: { messageId: message.id, status: 'queued' } }
  }

  // ─── Tags ──────────────────────────────────────────────────

  @Get('tags')
  @ApiOperation({ summary: 'List tags' })
  async listTags(@Req() req: Request) {
    const tenantId = this.getTenantId(req)

    const tags = await prisma.tag.findMany({
      where: { tenantId },
      select: { id: true, name: true, color: true, createdAt: true },
      orderBy: { name: 'asc' },
    })

    return { data: tags }
  }

  @Post('tags')
  @ApiOperation({ summary: 'Create a tag' })
  async createTag(@Req() req: Request, @Body() body: { name: string; color?: string }) {
    const tenantId = this.getTenantId(req)

    const tag = await prisma.tag.create({
      data: { tenantId, name: body.name, color: body.color },
    })

    return { data: tag }
  }

  @Delete('tags/:id')
  @ApiOperation({ summary: 'Delete a tag' })
  async deleteTag(@Req() req: Request, @Param('id') id: string) {
    const tenantId = this.getTenantId(req)

    await prisma.contactTag.deleteMany({ where: { tag: { id, tenantId } } })
    await prisma.tag.deleteMany({ where: { id, tenantId } })

    return { data: { deleted: true } }
  }
}
