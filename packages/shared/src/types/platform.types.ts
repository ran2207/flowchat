export type Platform =
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'tiktok'
  | 'telegram'
  | 'sms'
  | 'email'

export type ChannelStatus = 'active' | 'disconnected' | 'error'

export interface PlatformCapabilities {
  maxButtons: number
  maxQuickReplies: number
  supportsCarousel: boolean
  supportsAudio: boolean
  supportsVideo: boolean
  supportsTypingIndicator: boolean
  supportsReadReceipts: boolean
  requiresTemplateOutsideWindow: boolean
  maxTextLength: number
  messagingWindowHours: number | null
}

export const PLATFORM_CAPABILITIES: Record<Platform, PlatformCapabilities> = {
  instagram: {
    maxButtons: 3,
    maxQuickReplies: 13,
    supportsCarousel: false,
    supportsAudio: false,
    supportsVideo: true,
    supportsTypingIndicator: false,
    supportsReadReceipts: false,
    requiresTemplateOutsideWindow: false,
    maxTextLength: 1000,
    messagingWindowHours: 24,
  },
  facebook: {
    maxButtons: 3,
    maxQuickReplies: 13,
    supportsCarousel: true,
    supportsAudio: true,
    supportsVideo: true,
    supportsTypingIndicator: true,
    supportsReadReceipts: true,
    requiresTemplateOutsideWindow: false,
    maxTextLength: 2000,
    messagingWindowHours: 24,
  },
  whatsapp: {
    maxButtons: 3,
    maxQuickReplies: 3,
    supportsCarousel: false,
    supportsAudio: true,
    supportsVideo: true,
    supportsTypingIndicator: false,
    supportsReadReceipts: true,
    requiresTemplateOutsideWindow: true,
    maxTextLength: 4096,
    messagingWindowHours: 24,
  },
  tiktok: {
    maxButtons: 0,
    maxQuickReplies: 0,
    supportsCarousel: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsTypingIndicator: false,
    supportsReadReceipts: false,
    requiresTemplateOutsideWindow: false,
    maxTextLength: 500,
    messagingWindowHours: 48,
  },
  telegram: {
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
  },
  sms: {
    maxButtons: 0,
    maxQuickReplies: 0,
    supportsCarousel: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsTypingIndicator: false,
    supportsReadReceipts: false,
    requiresTemplateOutsideWindow: false,
    maxTextLength: 1600,
    messagingWindowHours: null,
  },
  email: {
    maxButtons: 10,
    maxQuickReplies: 0,
    supportsCarousel: false,
    supportsAudio: false,
    supportsVideo: false,
    supportsTypingIndicator: false,
    supportsReadReceipts: false,
    requiresTemplateOutsideWindow: false,
    maxTextLength: 100000,
    messagingWindowHours: null,
  },
}
