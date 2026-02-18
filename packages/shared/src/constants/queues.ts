export const QUEUE_NAMES = {
  INCOMING_MESSAGES: 'incoming-messages',
  OUTGOING_MESSAGES: 'outgoing-messages',
  FLOW_EXECUTIONS: 'flow-executions',
  SCHEDULED_MESSAGES: 'scheduled-messages',
  WEBHOOK_EVENTS: 'webhook-events',
  ANALYTICS: 'analytics-events',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]
