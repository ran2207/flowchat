import type {
  PlatformCapabilities,
  NormalizedIncomingMessage,
  NormalizedMessageContent,
  NormalizedButton,
} from '@flowchat/shared'
import type { PlatformAdapter, PlatformSendResult, ChannelCredentials } from '../adapter.interface'
import type {
  TelegramUpdate,
  TelegramMessage,
  TelegramOutgoingPayload,
  TelegramInlineKeyboardButton,
  TelegramApiResponse,
} from './telegram.types'

const TELEGRAM_API_BASE = 'https://api.telegram.org/bot'

export class TelegramAdapter implements PlatformAdapter {
  readonly platform = 'telegram' as const

  normalizeIncoming(raw: unknown): NormalizedIncomingMessage {
    const update = raw as TelegramUpdate

    if (update.callback_query) {
      const cb = update.callback_query
      return {
        platformMessageId: cb.id,
        senderId: String(cb.from.id),
        timestamp: cb.message ? new Date(cb.message.date * 1000) : new Date(),
        content: {
          type: 'text',
          text: cb.data ?? '',
        },
        postback: {
          payload: cb.data ?? '',
          title: cb.data ?? '',
        },
      }
    }

    if (update.message) {
      return this.normalizeMessage(update.message)
    }

    throw new Error(`Unsupported Telegram update type: ${JSON.stringify(Object.keys(update))}`)
  }

  buildOutgoing(
    message: NormalizedMessageContent,
    recipientId: string,
  ): TelegramOutgoingPayload {
    const chatId = Number(recipientId)

    if (message.attachments?.length) {
      const attachment = message.attachments[0]
      switch (attachment.type) {
        case 'image':
          return {
            method: 'sendPhoto',
            body: {
              chat_id: chatId,
              photo: attachment.url,
              caption: attachment.caption ?? message.text,
              parse_mode: 'HTML',
              ...(message.buttons?.length
                ? { reply_markup: { inline_keyboard: this.buildInlineKeyboard(message.buttons) } }
                : {}),
            },
          }
        case 'video':
          return {
            method: 'sendVideo',
            body: {
              chat_id: chatId,
              video: attachment.url,
              caption: attachment.caption ?? message.text,
              parse_mode: 'HTML',
              ...(message.buttons?.length
                ? { reply_markup: { inline_keyboard: this.buildInlineKeyboard(message.buttons) } }
                : {}),
            },
          }
        case 'audio':
        case 'file':
          return {
            method: 'sendDocument',
            body: {
              chat_id: chatId,
              document: attachment.url,
              caption: attachment.caption ?? message.text,
              parse_mode: 'HTML',
            },
          }
      }
    }

    const payload: TelegramOutgoingPayload = {
      method: 'sendMessage',
      body: {
        chat_id: chatId,
        text: message.text ?? '',
        parse_mode: 'HTML',
      },
    }

    if (message.buttons?.length) {
      payload.body.reply_markup = {
        inline_keyboard: this.buildInlineKeyboard(message.buttons),
      }
    } else if (message.quickReplies?.length) {
      payload.body.reply_markup = {
        inline_keyboard: [
          message.quickReplies.map((qr) => ({
            text: qr.title,
            callback_data: qr.payload,
          })),
        ],
      }
    }

    return payload
  }

  async send(
    payload: unknown,
    credentials: ChannelCredentials,
  ): Promise<PlatformSendResult> {
    const telegramPayload = payload as TelegramOutgoingPayload
    const url = `${TELEGRAM_API_BASE}${credentials.accessToken}/${telegramPayload.method}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramPayload.body),
      })

      const data = (await response.json()) as TelegramApiResponse

      if (!data.ok) {
        return {
          platformMessageId: '',
          status: 'failed',
          error: data.description ?? `Telegram API error: ${data.error_code}`,
        }
      }

      const result = data.result as { message_id?: number } | undefined
      return {
        platformMessageId: String(result?.message_id ?? ''),
        status: 'sent',
      }
    } catch (error) {
      return {
        platformMessageId: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error sending to Telegram',
      }
    }
  }

  getCapabilities(): PlatformCapabilities {
    return {
      maxButtons: 100,
      maxQuickReplies: 100,
      supportsCarousel: false,
      supportsAudio: true,
      supportsVideo: true,
      supportsTypingIndicator: true,
      supportsReadReceipts: false,
      requiresTemplateOutsideWindow: false,
      maxTextLength: 4096,
      messagingWindowHours: null,
    }
  }

  verifyWebhook(
    headers: Record<string, string>,
    _body: string | Buffer,
    secret: string,
  ): boolean {
    const token = headers['x-telegram-bot-api-secret-token']
    if (!token || !secret) return false

    if (token.length !== secret.length) return false

    let mismatch = 0
    for (let i = 0; i < token.length; i++) {
      mismatch |= token.charCodeAt(i) ^ secret.charCodeAt(i)
    }
    return mismatch === 0
  }

  private normalizeMessage(msg: TelegramMessage): NormalizedIncomingMessage {
    const base: NormalizedIncomingMessage = {
      platformMessageId: String(msg.message_id),
      senderId: String(msg.from.id),
      timestamp: new Date(msg.date * 1000),
      content: { type: 'text' },
    }

    if (msg.photo?.length) {
      const largestPhoto = msg.photo[msg.photo.length - 1]
      base.content = {
        type: 'image',
        text: msg.caption,
        attachments: [
          {
            type: 'image',
            url: largestPhoto.file_id,
            mimeType: 'image/jpeg',
            sizeBytes: largestPhoto.file_size,
          },
        ],
      }
      return base
    }

    if (msg.video) {
      base.content = {
        type: 'video',
        text: msg.caption,
        attachments: [
          {
            type: 'video',
            url: msg.video.file_id,
            mimeType: msg.video.mime_type ?? 'video/mp4',
            sizeBytes: msg.video.file_size,
          },
        ],
      }
      return base
    }

    if (msg.audio) {
      base.content = {
        type: 'audio',
        attachments: [
          {
            type: 'audio',
            url: msg.audio.file_id,
            mimeType: msg.audio.mime_type ?? 'audio/mpeg',
            sizeBytes: msg.audio.file_size,
          },
        ],
      }
      return base
    }

    if (msg.document) {
      base.content = {
        type: 'file',
        text: msg.caption,
        attachments: [
          {
            type: 'file',
            url: msg.document.file_id,
            mimeType: msg.document.mime_type ?? 'application/octet-stream',
            fileName: msg.document.file_name,
            sizeBytes: msg.document.file_size,
          },
        ],
      }
      return base
    }

    if (msg.voice) {
      base.content = {
        type: 'audio',
        attachments: [
          {
            type: 'audio',
            url: msg.voice.file_id,
            mimeType: msg.voice.mime_type ?? 'audio/ogg',
            sizeBytes: msg.voice.file_size,
          },
        ],
      }
      return base
    }

    base.content = {
      type: 'text',
      text: msg.text ?? '',
    }

    return base
  }

  private buildInlineKeyboard(buttons: NormalizedButton[]): TelegramInlineKeyboardButton[][] {
    const rows: TelegramInlineKeyboardButton[][] = []
    let currentRow: TelegramInlineKeyboardButton[] = []

    for (const btn of buttons) {
      const telegramBtn: TelegramInlineKeyboardButton = { text: btn.title }

      if (btn.type === 'url' && btn.url) {
        telegramBtn.url = btn.url
      } else {
        telegramBtn.callback_data = btn.payload ?? btn.title
      }

      currentRow.push(telegramBtn)

      if (currentRow.length >= 3) {
        rows.push(currentRow)
        currentRow = []
      }
    }

    if (currentRow.length > 0) {
      rows.push(currentRow)
    }

    return rows
  }
}
