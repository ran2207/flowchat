export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
  callback_query?: TelegramCallbackQuery
  edited_message?: TelegramMessage
}

export interface TelegramMessage {
  message_id: number
  from: TelegramUser
  chat: TelegramChat
  date: number
  text?: string
  photo?: TelegramPhotoSize[]
  video?: TelegramVideo
  audio?: TelegramAudio
  document?: TelegramDocument
  voice?: TelegramVoice
  sticker?: TelegramSticker
  caption?: string
  reply_markup?: TelegramInlineKeyboardMarkup
}

export interface TelegramCallbackQuery {
  id: string
  from: TelegramUser
  message?: TelegramMessage
  data?: string
}

export interface TelegramUser {
  id: number
  is_bot: boolean
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
}

export interface TelegramChat {
  id: number
  type: 'private' | 'group' | 'supergroup' | 'channel'
  title?: string
  first_name?: string
  last_name?: string
  username?: string
}

export interface TelegramPhotoSize {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  file_size?: number
}

export interface TelegramVideo {
  file_id: string
  file_unique_id: string
  width: number
  height: number
  duration: number
  mime_type?: string
  file_size?: number
}

export interface TelegramAudio {
  file_id: string
  file_unique_id: string
  duration: number
  performer?: string
  title?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramDocument {
  file_id: string
  file_unique_id: string
  file_name?: string
  mime_type?: string
  file_size?: number
}

export interface TelegramVoice {
  file_id: string
  file_unique_id: string
  duration: number
  mime_type?: string
  file_size?: number
}

export interface TelegramSticker {
  file_id: string
  file_unique_id: string
  type: string
  width: number
  height: number
  emoji?: string
}

export interface TelegramInlineKeyboardMarkup {
  inline_keyboard: TelegramInlineKeyboardButton[][]
}

export interface TelegramInlineKeyboardButton {
  text: string
  url?: string
  callback_data?: string
}

export interface TelegramSendMessagePayload {
  chat_id: number | string
  text?: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  reply_markup?: TelegramInlineKeyboardMarkup
}

export interface TelegramSendPhotoPayload {
  chat_id: number | string
  photo: string
  caption?: string
  parse_mode?: 'HTML'
  reply_markup?: TelegramInlineKeyboardMarkup
}

export interface TelegramSendVideoPayload {
  chat_id: number | string
  video: string
  caption?: string
  parse_mode?: 'HTML'
  reply_markup?: TelegramInlineKeyboardMarkup
}

export interface TelegramSendDocumentPayload {
  chat_id: number | string
  document: string
  caption?: string
  parse_mode?: 'HTML'
}

export interface TelegramApiResponse<T = unknown> {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
}

export type TelegramOutgoingPayload =
  | { method: 'sendMessage'; body: TelegramSendMessagePayload }
  | { method: 'sendPhoto'; body: TelegramSendPhotoPayload }
  | { method: 'sendVideo'; body: TelegramSendVideoPayload }
  | { method: 'sendDocument'; body: TelegramSendDocumentPayload }
  | { method: 'sendChatAction'; body: { chat_id: number | string; action: string } }
  | { method: 'answerCallbackQuery'; body: { callback_query_id: string; text?: string } }
