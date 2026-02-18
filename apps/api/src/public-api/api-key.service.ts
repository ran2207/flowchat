import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { prisma } from '@flowchat/database'
import * as crypto from 'crypto'

export interface ApiKeyInfo {
  id: string
  name: string
  prefix: string
  permissions: string[]
  rateLimit: number
  lastUsedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  revokedAt: Date | null
}

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name)

  async createKey(
    tenantId: string,
    name: string,
    permissions: string[] = ['read'],
    rateLimit: number = 60,
  ): Promise<{ key: string; keyInfo: ApiKeyInfo }> {
    const rawKey = `fc_${crypto.randomBytes(32).toString('hex')}`
    const prefix = rawKey.substring(0, 7)
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    const existing = await prisma.apiKey.count({
      where: { tenantId, revokedAt: null },
    })

    if (existing >= 10) {
      throw new BadRequestException('Maximum 10 active API keys per tenant')
    }

    const record = await prisma.apiKey.create({
      data: {
        tenantId,
        name,
        keyHash,
        prefix,
        permissions: permissions,
        rateLimit,
      },
    })

    this.logger.log(`API key created: ${prefix}... for tenant ${tenantId}`)

    return {
      key: rawKey,
      keyInfo: this.toApiKeyInfo(record),
    }
  }

  async listKeys(tenantId: string): Promise<ApiKeyInfo[]> {
    const keys = await prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return keys.map((k: {
      id: string
      name: string
      prefix: string
      permissions: unknown
      rateLimit: number
      lastUsedAt: Date | null
      expiresAt: Date | null
      createdAt: Date
      revokedAt: Date | null
    }) => this.toApiKeyInfo(k))
  }

  async revokeKey(tenantId: string, keyId: string): Promise<void> {
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId, tenantId },
    })

    if (!key) throw new NotFoundException('API key not found')

    if (key.revokedAt) {
      throw new BadRequestException('API key is already revoked')
    }

    await prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    })

    this.logger.log(`API key ${key.prefix}... revoked for tenant ${tenantId}`)
  }

  async validateKey(
    rawKey: string,
  ): Promise<{ tenantId: string; permissions: string[]; rateLimit: number } | null> {
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    const key = await prisma.apiKey.findUnique({
      where: { keyHash },
    })

    if (!key || key.revokedAt) return null

    if (key.expiresAt && key.expiresAt < new Date()) return null

    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    })

    return {
      tenantId: key.tenantId,
      permissions: key.permissions as string[],
      rateLimit: key.rateLimit,
    }
  }

  private toApiKeyInfo(record: {
    id: string
    name: string
    prefix: string
    permissions: unknown
    rateLimit: number
    lastUsedAt: Date | null
    expiresAt: Date | null
    createdAt: Date
    revokedAt: Date | null
  }): ApiKeyInfo {
    return {
      id: record.id,
      name: record.name,
      prefix: record.prefix,
      permissions: record.permissions as string[],
      rateLimit: record.rateLimit,
      lastUsedAt: record.lastUsedAt,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      revokedAt: record.revokedAt,
    }
  }
}
