export type MessageDirection = 'incoming' | 'outgoing'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export type MessageContentType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'template'

export interface NormalizedAttachment {
  type: 'image' | 'video' | 'audio' | 'file'
  url: string
  mimeType: string
  fileName?: string
  sizeBytes?: number
  caption?: string
}

export interface NormalizedButton {
  type: 'url' | 'postback' | 'call'
  title: string
  payload?: string
  url?: string
  phone?: string
}

export interface NormalizedQuickReply {
  title: string
  payload: string
  imageUrl?: string
}

export interface NormalizedCarouselItem {
  title: string
  subtitle?: string
  imageUrl?: string
  buttons?: NormalizedButton[]
}

export interface NormalizedMessageContent {
  type: MessageContentType
  text?: string
  attachments?: NormalizedAttachment[]
  buttons?: NormalizedButton[]
  quickReplies?: NormalizedQuickReply[]
  carousel?: NormalizedCarouselItem[]
}

export interface NormalizedIncomingMessage {
  platformMessageId: string
  senderId: string
  timestamp: Date
  content: NormalizedMessageContent
  postback?: {
    payload: string
    title: string
  }
}
