export type TenantPlan = 'free' | 'pro' | 'enterprise'
export type TenantSubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'trialing'

export interface TenantSettings {
  timezone: string
  locale: string
  branding?: {
    logoUrl?: string
    primaryColor?: string
  }
}

export interface TenantPlanLimits {
  requestsPerSecond: number
  messagesPerMonth: number
  contacts: number
  flows: number
  teamMembers: number
  channels: number
  liveChatSeats: number
  tags: number
}

export const PLAN_LIMITS: Record<TenantPlan, TenantPlanLimits> = {
  free: {
    requestsPerSecond: 10,
    messagesPerMonth: 1000,
    contacts: 500,
    flows: 5,
    teamMembers: 1,
    channels: 1,
    liveChatSeats: 1,
    tags: 10,
  },
  pro: {
    requestsPerSecond: 50,
    messagesPerMonth: 50000,
    contacts: 25000,
    flows: 50,
    teamMembers: 5,
    channels: 7,
    liveChatSeats: 3,
    tags: -1,
  },
  enterprise: {
    requestsPerSecond: 200,
    messagesPerMonth: -1,
    contacts: -1,
    flows: -1,
    teamMembers: -1,
    channels: -1,
    liveChatSeats: -1,
    tags: -1,
  },
}
