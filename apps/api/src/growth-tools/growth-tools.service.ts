import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { prisma } from '@flowchat/database'
import * as crypto from 'crypto'

export interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left'
  color: string
  greeting: string
  channels: Array<{ platform: string; url: string }>
  showOnMobile: boolean
  delay: number
}

export interface RefUrl {
  id: string
  tenantId: string
  name: string
  platform: string
  ref: string
  url: string
  clicks: number
  createdAt: Date
}

@Injectable()
export class GrowthToolsService {
  constructor(private readonly configService: ConfigService) {}

  async generateQrCode(
    _tenantId: string,
    data: { platform: string; url: string; size?: number },
  ): Promise<{ qrDataUrl: string }> {
    const size = data.size ?? 256
    const encoded = encodeURIComponent(data.url)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}`

    return { qrDataUrl: qrApiUrl }
  }

  async createRefUrl(
    tenantId: string,
    data: { name: string; platform: string; channelId?: string },
  ): Promise<RefUrl> {
    const ref = crypto.randomBytes(6).toString('hex')
    const baseUrl = this.configService.get<string>('WEBHOOK_BASE_URL') ?? 'https://app.flowchat.io'
    const url = `${baseUrl}/r/${ref}`

    const event = await prisma.analyticsEvent.create({
      data: {
        tenantId,
        eventType: 'ref_url',
        entityType: data.platform,
        entityId: ref,
        properties: {
          name: data.name,
          platform: data.platform,
          channelId: data.channelId ?? null,
          url,
          clicks: 0,
        },
      },
    })

    return {
      id: event.id,
      tenantId,
      name: data.name,
      platform: data.platform,
      ref,
      url,
      clicks: 0,
      createdAt: event.createdAt,
    }
  }

  async listRefUrls(tenantId: string): Promise<RefUrl[]> {
    const events = await prisma.analyticsEvent.findMany({
      where: { tenantId, eventType: 'ref_url' },
      orderBy: { createdAt: 'desc' },
    })

    return events.map((e: { id: string; tenantId: string; entityType: string | null; entityId: string | null; properties: unknown; createdAt: Date }) => {
      const props = e.properties as Record<string, unknown>
      return {
        id: e.id,
        tenantId: e.tenantId,
        name: (props.name as string) ?? '',
        platform: e.entityType ?? '',
        ref: e.entityId ?? '',
        url: (props.url as string) ?? '',
        clicks: (props.clicks as number) ?? 0,
        createdAt: e.createdAt,
      }
    })
  }

  async deleteRefUrl(tenantId: string, id: string): Promise<void> {
    await prisma.analyticsEvent.deleteMany({
      where: { id, tenantId, eventType: 'ref_url' },
    })
  }

  async trackRefClick(ref: string): Promise<{ redirectUrl: string } | null> {
    const event = await prisma.analyticsEvent.findFirst({
      where: { eventType: 'ref_url', entityId: ref },
    })

    if (!event) return null

    const props = event.properties as Record<string, unknown>
    const clicks = ((props.clicks as number) ?? 0) + 1

    await prisma.analyticsEvent.update({
      where: { id: event.id },
      data: { properties: { ...props, clicks } },
    })

    return { redirectUrl: (props.url as string) ?? '/' }
  }

  async getWidgetConfig(tenantId: string): Promise<WidgetConfig> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant?.settings as Record<string, unknown>) ?? {}
    const widget = (settings.widget as Partial<WidgetConfig>) ?? {}

    return {
      position: widget.position ?? 'bottom-right',
      color: widget.color ?? '#3b82f6',
      greeting: widget.greeting ?? 'Hi there! How can we help you?',
      channels: widget.channels ?? [],
      showOnMobile: widget.showOnMobile ?? true,
      delay: widget.delay ?? 3,
    }
  }

  async updateWidgetConfig(
    tenantId: string,
    config: Partial<WidgetConfig>,
  ): Promise<WidgetConfig> {
    const current = await this.getWidgetConfig(tenantId)
    const updated = { ...current, ...config }

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    settings.widget = updated

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: settings as object },
    })

    return updated
  }

  generateWidgetScript(tenantId: string): string {
    const baseUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000'
    return `<script src="${baseUrl}/widget.js" data-tenant="${tenantId}" async></script>`
  }
}
