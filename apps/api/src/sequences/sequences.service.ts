import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { prisma } from '@flowchat/database'
import { QueueService, QUEUE_NAMES } from '../queue/queue.service'

export interface SequenceStep {
  id: string
  type: 'message' | 'delay' | 'condition' | 'action'
  content?: Record<string, unknown>
  delay?: { duration: number; unit: 'minutes' | 'hours' | 'days' }
  condition?: { field: string; operator: string; value: string }
  action?: { type: string; config: Record<string, unknown> }
}

@Injectable()
export class SequencesService {
  private readonly logger = new Logger(SequencesService.name)

  constructor(private readonly queueService: QueueService) {}

  async create(
    tenantId: string,
    data: { name: string; steps?: SequenceStep[] },
  ) {
    return prisma.sequence.create({
      data: {
        tenantId,
        name: data.name,
        steps: (data.steps ?? []) as unknown as Record<string, unknown>[],
        status: 'draft',
      },
    })
  }

  async findAll(
    tenantId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ) {
    const { status, page = 1, limit = 20 } = options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { tenantId }
    if (status) where.status = status

    const [sequences, total] = await Promise.all([
      prisma.sequence.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { subscriptions: true } },
        },
      }),
      prisma.sequence.count({ where }),
    ])

    return { sequences, total, page, limit }
  }

  async findOne(tenantId: string, id: string) {
    const sequence = await prisma.sequence.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { subscriptions: true } },
      },
    })

    if (!sequence) throw new NotFoundException('Sequence not found')
    return sequence
  }

  async update(
    tenantId: string,
    id: string,
    data: { name?: string; steps?: SequenceStep[]; status?: string },
  ) {
    await this.findOne(tenantId, id)

    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.steps !== undefined)
      updateData.steps = data.steps as unknown as Record<string, unknown>[]
    if (data.status !== undefined) updateData.status = data.status

    return prisma.sequence.update({ where: { id }, data: updateData })
  }

  async delete(tenantId: string, id: string) {
    await this.findOne(tenantId, id)
    await prisma.sequenceSubscription.deleteMany({ where: { sequenceId: id } })
    await prisma.sequence.delete({ where: { id } })
  }

  async subscribe(
    tenantId: string,
    sequenceId: string,
    contactId: string,
  ) {
    const sequence = await this.findOne(tenantId, sequenceId)
    const steps = sequence.steps as unknown as SequenceStep[]

    if (steps.length === 0) {
      throw new Error('Cannot subscribe to a sequence with no steps')
    }

    const existing = await prisma.sequenceSubscription.findUnique({
      where: {
        sequenceId_contactId: { sequenceId, contactId },
      },
    })

    if (existing) {
      if (existing.status === 'active') return existing
      return prisma.sequenceSubscription.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          currentStep: 0,
          nextStepAt: this.calculateNextStepTime(steps[0]),
        },
      })
    }

    const sub = await prisma.sequenceSubscription.create({
      data: {
        tenantId,
        sequenceId,
        contactId,
        status: 'active',
        currentStep: 0,
        nextStepAt: this.calculateNextStepTime(steps[0]),
      },
    })

    await this.scheduleStepExecution(sub.id, steps[0])

    return sub
  }

  async unsubscribe(sequenceId: string, contactId: string) {
    const sub = await prisma.sequenceSubscription.findUnique({
      where: { sequenceId_contactId: { sequenceId, contactId } },
    })
    if (!sub) return

    await prisma.sequenceSubscription.update({
      where: { id: sub.id },
      data: { status: 'completed' },
    })
  }

  async bulkSubscribe(
    tenantId: string,
    sequenceId: string,
    contactIds: string[],
  ) {
    let enrolled = 0
    for (const contactId of contactIds) {
      try {
        await this.subscribe(tenantId, sequenceId, contactId)
        enrolled++
      } catch (error) {
        this.logger.warn(
          `Failed to subscribe contact ${contactId}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }
    }
    return { enrolled, total: contactIds.length }
  }

  async getSubscriptions(
    tenantId: string,
    sequenceId: string,
    options: { status?: string; page?: number; limit?: number } = {},
  ) {
    const { status, page = 1, limit = 20 } = options
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { sequenceId, tenantId }
    if (status) where.status = status

    const [subscriptions, total] = await Promise.all([
      prisma.sequenceSubscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              platform: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.sequenceSubscription.count({ where }),
    ])

    return { subscriptions, total, page, limit }
  }

  async processStep(subscriptionId: string): Promise<void> {
    const sub = await prisma.sequenceSubscription.findUnique({
      where: { id: subscriptionId },
      include: {
        sequence: true,
        contact: {
          select: {
            id: true,
            tenantId: true,
            channelId: true,
            platformUserId: true,
          },
        },
      },
    })

    if (!sub || sub.status !== 'active') return

    const steps = sub.sequence.steps as unknown as SequenceStep[]
    const currentStep = steps[sub.currentStep]

    if (!currentStep) {
      await prisma.sequenceSubscription.update({
        where: { id: subscriptionId },
        data: { status: 'completed' },
      })
      return
    }

    if (currentStep.type === 'message' && currentStep.content) {
      await this.queueService.addJob(
        QUEUE_NAMES.OUTGOING_MESSAGES,
        'sequence:message',
        {
          tenantId: sub.contact.tenantId,
          contactId: sub.contact.id,
          channelId: sub.contact.channelId,
          platformUserId: sub.contact.platformUserId,
          content: currentStep.content,
          sequenceId: sub.sequenceId,
          subscriptionId: sub.id,
        },
      )
    }

    const nextStepIndex = sub.currentStep + 1
    if (nextStepIndex >= steps.length) {
      await prisma.sequenceSubscription.update({
        where: { id: subscriptionId },
        data: { status: 'completed', currentStep: nextStepIndex },
      })
      return
    }

    const nextStep = steps[nextStepIndex]
    const nextStepAt = this.calculateNextStepTime(nextStep)

    await prisma.sequenceSubscription.update({
      where: { id: subscriptionId },
      data: {
        currentStep: nextStepIndex,
        nextStepAt,
      },
    })

    await this.scheduleStepExecution(subscriptionId, nextStep, nextStepAt)
  }

  private calculateNextStepTime(step: SequenceStep): Date {
    if (step.type === 'delay' && step.delay) {
      const now = new Date()
      const { duration, unit } = step.delay
      const ms =
        unit === 'minutes'
          ? duration * 60_000
          : unit === 'hours'
            ? duration * 3_600_000
            : duration * 86_400_000
      return new Date(now.getTime() + ms)
    }
    return new Date()
  }

  private async scheduleStepExecution(
    subscriptionId: string,
    _step: SequenceStep,
    executeAt?: Date,
  ): Promise<void> {
    const delay = executeAt ? Math.max(0, executeAt.getTime() - Date.now()) : 0

    await this.queueService.addJob(
      QUEUE_NAMES.SCHEDULED_MESSAGES,
      'sequence:step',
      { subscriptionId },
      { delay },
    )
  }
}
