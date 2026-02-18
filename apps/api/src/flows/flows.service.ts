import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import { CreateFlowDto } from './dto/create-flow.dto'
import { UpdateFlowDto } from './dto/update-flow.dto'

@Injectable()
export class FlowsService {
  async findAll(tenantId: string) {
    return prisma.flow.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        triggerType: true,
        currentVersion: true,
        stats: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findOne(tenantId: string, flowId: string) {
    const flow = await prisma.flow.findFirst({
      where: { id: flowId, tenantId, deletedAt: null },
    })

    if (!flow) {
      throw new NotFoundException('Flow not found')
    }

    return flow
  }

  async create(tenantId: string, userId: string, dto: CreateFlowDto) {
    return prisma.flow.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        triggerType: dto.triggerType,
        triggerConfig: (dto.triggerConfig ?? {}) as object,
        createdById: userId,
        updatedById: userId,
      },
    })
  }

  async update(tenantId: string, flowId: string, userId: string, dto: UpdateFlowDto) {
    const flow = await this.findOne(tenantId, flowId)

    if (flow.status === 'archived') {
      throw new ForbiddenException('Cannot update an archived flow')
    }

    const data: Record<string, unknown> = { updatedById: userId }

    if (dto.name !== undefined) data.name = dto.name
    if (dto.description !== undefined) data.description = dto.description
    if (dto.triggerType !== undefined) data.triggerType = dto.triggerType
    if (dto.triggerConfig !== undefined) data.triggerConfig = dto.triggerConfig
    if (dto.definition !== undefined) data.definition = dto.definition

    return prisma.flow.update({
      where: { id: flowId },
      data,
    })
  }

  async publish(tenantId: string, flowId: string, userId: string) {
    const flow = await this.findOne(tenantId, flowId)

    const nextVersion = flow.currentVersion + 1

    await prisma.flowVersion.create({
      data: {
        flowId,
        version: nextVersion,
        definition: flow.definition as object,
        publishedBy: userId,
      },
    })

    return prisma.flow.update({
      where: { id: flowId },
      data: {
        status: 'published',
        publishedDefinition: flow.definition as object,
        currentVersion: nextVersion,
        publishedAt: new Date(),
        updatedById: userId,
      },
    })
  }

  async archive(tenantId: string, flowId: string) {
    await this.findOne(tenantId, flowId)

    return prisma.flow.update({
      where: { id: flowId },
      data: { status: 'archived' },
    })
  }

  async remove(tenantId: string, flowId: string) {
    await this.findOne(tenantId, flowId)

    return prisma.flow.update({
      where: { id: flowId },
      data: { deletedAt: new Date() },
    })
  }

  async duplicate(tenantId: string, flowId: string, userId: string) {
    const original = await this.findOne(tenantId, flowId)

    return prisma.flow.create({
      data: {
        tenantId,
        name: `${original.name} (Copy)`,
        description: original.description,
        triggerType: original.triggerType,
        triggerConfig: original.triggerConfig as object,
        definition: original.definition as object,
        createdById: userId,
        updatedById: userId,
      },
    })
  }
}
