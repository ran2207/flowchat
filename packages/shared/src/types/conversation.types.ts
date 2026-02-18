export type ConversationStatus =
  | 'new'
  | 'bot'
  | 'queued'
  | 'assigned'
  | 'active'
  | 'pending'
  | 'resolved'
  | 'closed'

export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent'

export const VALID_CONVERSATION_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  new: ['bot', 'queued', 'assigned'],
  bot: ['queued', 'assigned', 'resolved'],
  queued: ['assigned', 'bot'],
  assigned: ['active', 'queued', 'resolved'],
  active: ['pending', 'resolved', 'queued'],
  pending: ['active', 'resolved', 'closed'],
  resolved: ['active', 'closed'],
  closed: ['active'],
}
