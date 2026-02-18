import { Injectable } from '@nestjs/common'
import { prisma } from '@flowchat/database'

export interface OverviewStats {
  totalContacts: number
  activeContacts: number
  newContactsToday: number
  totalMessagesSent: number
  totalMessagesReceived: number
  openConversations: number
  flowsTriggered: number
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface ChannelStats {
  platform: string
  contacts: number
  messagesSent: number
  messagesReceived: number
}

export interface FlowStats {
  flowId: string
  flowName: string
  triggered: number
  completed: number
  failed: number
}

export interface AgentStats {
  agentId: string
  agentName: string
  conversationsHandled: number
  messagesCount: number
}

@Injectable()
export class AnalyticsService {

  async getOverview(tenantId: string): Promise<OverviewStats> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      totalContacts,
      activeContacts,
      newContactsToday,
      totalMessagesSent,
      totalMessagesReceived,
      openConversations,
      flowsTriggered,
    ] = await Promise.all([
      prisma.contact.count({
        where: { tenantId, deletedAt: null },
      }),
      prisma.contact.count({
        where: {
          tenantId,
          deletedAt: null,
          lastInteractionAt: { gte: new Date(Date.now() - 30 * 86_400_000) },
        },
      }),
      prisma.contact.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: today } },
      }),
      prisma.message.count({
        where: { tenantId, direction: 'outbound' },
      }),
      prisma.message.count({
        where: { tenantId, direction: 'inbound' },
      }),
      prisma.conversation.count({
        where: { tenantId, status: { in: ['new', 'open', 'assigned'] } },
      }),
      prisma.flowExecution.count({
        where: { tenantId },
      }),
    ])

    return {
      totalContacts,
      activeContacts,
      newContactsToday,
      totalMessagesSent,
      totalMessagesReceived,
      openConversations,
      flowsTriggered,
    }
  }

  async getMessageTimeSeries(
    tenantId: string,
    days: number = 30,
  ): Promise<{ sent: TimeSeriesPoint[]; received: TimeSeriesPoint[] }> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const messages = await prisma.message.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
      select: { direction: true, createdAt: true },
    })

    const sentByDay = new Map<string, number>()
    const receivedByDay = new Map<string, number>()

    for (const msg of messages) {
      const dateKey = msg.createdAt.toISOString().split('T')[0]
      if (msg.direction === 'outbound') {
        sentByDay.set(dateKey, (sentByDay.get(dateKey) ?? 0) + 1)
      } else {
        receivedByDay.set(dateKey, (receivedByDay.get(dateKey) ?? 0) + 1)
      }
    }

    const sent: TimeSeriesPoint[] = []
    const received: TimeSeriesPoint[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      sent.push({ date: dateKey, value: sentByDay.get(dateKey) ?? 0 })
      received.push({ date: dateKey, value: receivedByDay.get(dateKey) ?? 0 })
    }

    return { sent, received }
  }

  async getContactGrowth(
    tenantId: string,
    days: number = 30,
  ): Promise<TimeSeriesPoint[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    startDate.setHours(0, 0, 0, 0)

    const contacts = await prisma.contact.findMany({
      where: { tenantId, deletedAt: null, createdAt: { gte: startDate } },
      select: { createdAt: true },
    })

    const byDay = new Map<string, number>()
    for (const contact of contacts) {
      const dateKey = contact.createdAt.toISOString().split('T')[0]
      byDay.set(dateKey, (byDay.get(dateKey) ?? 0) + 1)
    }

    const points: TimeSeriesPoint[] = []
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = date.toISOString().split('T')[0]
      points.push({ date: dateKey, value: byDay.get(dateKey) ?? 0 })
    }

    return points
  }

  async getChannelStats(tenantId: string): Promise<ChannelStats[]> {
    const channels = await prisma.channel.findMany({
      where: { tenantId },
      select: { platform: true },
    })

    const platformSet = new Set<string>(channels.map((c: { platform: string }) => c.platform))
    const platforms = Array.from(platformSet)
    const stats: ChannelStats[] = []

    for (const platform of platforms) {
      const [contacts, messagesSent, messagesReceived] = await Promise.all([
        prisma.contact.count({
          where: { tenantId, platform, deletedAt: null },
        }),
        prisma.message.count({
          where: {
            tenantId,
            direction: 'outbound',
            conversation: { channel: { platform } },
          },
        }),
        prisma.message.count({
          where: {
            tenantId,
            direction: 'inbound',
            conversation: { channel: { platform } },
          },
        }),
      ])

      stats.push({ platform, contacts, messagesSent, messagesReceived })
    }

    return stats
  }

  async getFlowStats(tenantId: string): Promise<FlowStats[]> {
    const flows = await prisma.flow.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, name: true },
    })

    const stats: FlowStats[] = []

    for (const flow of flows) {
      const [triggered, completed, failed] = await Promise.all([
        prisma.flowExecution.count({
          where: { tenantId, flowId: flow.id },
        }),
        prisma.flowExecution.count({
          where: { tenantId, flowId: flow.id, status: 'completed' },
        }),
        prisma.flowExecution.count({
          where: { tenantId, flowId: flow.id, status: 'failed' },
        }),
      ])

      stats.push({
        flowId: flow.id,
        flowName: flow.name,
        triggered,
        completed,
        failed,
      })
    }

    return stats.sort((a, b) => b.triggered - a.triggered)
  }

  async getAgentStats(tenantId: string): Promise<AgentStats[]> {
    const agents = await prisma.user.findMany({
      where: { tenantId, role: { in: ['agent', 'admin', 'owner'] }, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    })

    const stats: AgentStats[] = []

    for (const agent of agents) {
      const [conversationsHandled, messagesCount] = await Promise.all([
        prisma.conversation.count({
          where: { tenantId, assignedAgentId: agent.id },
        }),
        prisma.message.count({
          where: { tenantId, agentId: agent.id },
        }),
      ])

      stats.push({
        agentId: agent.id,
        agentName: [agent.firstName, agent.lastName].filter(Boolean).join(' ') || 'Unknown',
        conversationsHandled,
        messagesCount,
      })
    }

    return stats.sort((a, b) => b.conversationsHandled - a.conversationsHandled)
  }

  async trackEvent(
    tenantId: string,
    eventType: string,
    data: {
      entityType?: string
      entityId?: string
      contactId?: string
      properties?: Record<string, unknown>
    } = {},
  ): Promise<void> {
    await prisma.analyticsEvent.create({
      data: {
        tenantId,
        eventType,
        entityType: data.entityType ?? null,
        entityId: data.entityId ?? null,
        contactId: data.contactId ?? null,
        properties: data.properties ?? {},
      },
    })
  }
}
