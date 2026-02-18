import type {
  Platform,
  PlatformCapabilities,
  NormalizedIncomingMessage,
  NormalizedMessageContent,
} from '@flowchat/shared'

export interface PlatformSendResult {
  platformMessageId: string
  status: 'sent' | 'failed'
  error?: string
}

export interface ChannelCredentials {
  accessToken: string
  [key: string]: unknown
}

export interface PlatformAdapter {
  readonly platform: Platform

  normalizeIncoming(raw: unknown): NormalizedIncomingMessage

  buildOutgoing(
    message: NormalizedMessageContent,
    recipientId: string,
  ): unknown

  send(
    payload: unknown,
    credentials: ChannelCredentials,
  ): Promise<PlatformSendResult>

  getCapabilities(): PlatformCapabilities

  verifyWebhook(headers: Record<string, string>, body: string | Buffer, secret: string): boolean
}
