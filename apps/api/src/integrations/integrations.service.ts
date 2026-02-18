import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { prisma } from '@flowchat/database'
import * as crypto from 'crypto'

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  isActive: boolean
  createdAt: Date
}

export const WEBHOOK_EVENTS = [
  'contact.created',
  'contact.updated',
  'contact.tagged',
  'message.received',
  'message.sent',
  'conversation.opened',
  'conversation.resolved',
  'flow.triggered',
  'flow.completed',
  'broadcast.sent',
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name)

  // ─── Outgoing Webhooks ─────────────────────────────────────

  async createWebhook(
    tenantId: string,
    name: string,
    url: string,
    events: string[],
  ): Promise<WebhookConfig> {
    const secret = crypto.randomBytes(32).toString('hex')

    const webhook = await prisma.outgoingWebhook.create({
      data: { tenantId, name, url, secret, events, isActive: true },
    })

    return this.toWebhookConfig(webhook)
  }

  async listWebhooks(tenantId: string): Promise<WebhookConfig[]> {
    const webhooks = await prisma.outgoingWebhook.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return webhooks.map((w: {
      id: string
      name: string
      url: string
      events: unknown
      isActive: boolean
      createdAt: Date
    }) => this.toWebhookConfig(w))
  }

  async updateWebhook(
    tenantId: string,
    webhookId: string,
    data: { name?: string; url?: string; events?: string[]; isActive?: boolean },
  ): Promise<WebhookConfig> {
    const existing = await prisma.outgoingWebhook.findFirst({
      where: { id: webhookId, tenantId },
    })

    if (!existing) throw new NotFoundException('Webhook not found')

    const updated = await prisma.outgoingWebhook.update({
      where: { id: webhookId },
      data: {
        name: data.name ?? existing.name,
        url: data.url ?? existing.url,
        events: data.events ?? (existing.events as string[]),
        isActive: data.isActive ?? existing.isActive,
      },
    })

    return this.toWebhookConfig(updated)
  }

  async deleteWebhook(tenantId: string, webhookId: string): Promise<void> {
    const existing = await prisma.outgoingWebhook.findFirst({
      where: { id: webhookId, tenantId },
    })

    if (!existing) throw new NotFoundException('Webhook not found')

    await prisma.outgoingWebhook.delete({ where: { id: webhookId } })
  }

  async testWebhook(tenantId: string, webhookId: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const webhook = await prisma.outgoingWebhook.findFirst({
      where: { id: webhookId, tenantId },
    })

    if (!webhook) throw new NotFoundException('Webhook not found')

    const payload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      data: { message: 'This is a test webhook event from FlowChat' },
    }

    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FlowChat-Signature': signature,
          'X-FlowChat-Event': 'test',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })

      return { success: response.ok, statusCode: response.status }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  async dispatchEvent(
    tenantId: string,
    event: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const webhooks = await prisma.outgoingWebhook.findMany({
      where: { tenantId, isActive: true },
    })

    const matching = webhooks.filter((w: { events: unknown }) => {
      const events = w.events as string[]
      return events.includes(event) || events.includes('*')
    })

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    }

    const body = JSON.stringify(payload)

    for (const webhook of matching) {
      const signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex')

      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-FlowChat-Signature': signature,
          'X-FlowChat-Event': event,
        },
        body,
        signal: AbortSignal.timeout(10_000),
      }).catch((err) => {
        this.logger.warn(
          `Webhook ${webhook.id} delivery failed for ${event}: ${err instanceof Error ? err.message : 'Unknown'}`,
        )
      })
    }
  }

  // ─── Zapier Integration ────────────────────────────────────

  async getZapierConfig(tenantId: string): Promise<{
    connected: boolean
    subscribedEvents: string[]
  }> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    const zapier = (settings.zapier as Record<string, unknown>) ?? {}

    return {
      connected: !!zapier.webhookUrl,
      subscribedEvents: (zapier.events as string[]) ?? [],
    }
  }

  async configureZapier(
    tenantId: string,
    webhookUrl: string,
    events: string[],
  ): Promise<void> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    settings.zapier = { webhookUrl, events, configuredAt: new Date().toISOString() }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    })
  }

  async disconnectZapier(tenantId: string): Promise<void> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    delete settings.zapier

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    })
  }

  // ─── Google Sheets Integration ─────────────────────────────

  async getGoogleSheetsConfig(tenantId: string): Promise<{
    connected: boolean
    spreadsheetId: string | null
  }> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    const sheets = (settings.googleSheets as Record<string, unknown>) ?? {}

    return {
      connected: !!sheets.accessToken,
      spreadsheetId: (sheets.spreadsheetId as string) ?? null,
    }
  }

  async configureGoogleSheets(
    tenantId: string,
    accessToken: string,
    refreshToken: string,
    spreadsheetId: string,
  ): Promise<void> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    settings.googleSheets = {
      accessToken,
      refreshToken,
      spreadsheetId,
      connectedAt: new Date().toISOString(),
    }

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    })
  }

  async disconnectGoogleSheets(tenantId: string): Promise<void> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    delete settings.googleSheets

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings },
    })
  }

  private toWebhookConfig(record: {
    id: string
    name: string
    url: string
    events: unknown
    isActive: boolean
    createdAt: Date
  }): WebhookConfig {
    return {
      id: record.id,
      name: record.name,
      url: record.url,
      events: record.events as string[],
      isActive: record.isActive,
      createdAt: record.createdAt,
    }
  }
}
