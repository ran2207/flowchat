export interface PlanDefinition {
  id: string
  name: string
  price: number
  stripePriceId: string | null
  limits: {
    contacts: number
    channels: number
    messagesPerMonth: number
    teamMembers: number
    liveChatSeats: number
    flows: number
    broadcasts: number
  }
  features: string[]
}

export const PLANS: Record<string, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    limits: {
      contacts: 500,
      channels: 1,
      messagesPerMonth: 1000,
      teamMembers: 2,
      liveChatSeats: 1,
      flows: 5,
      broadcasts: 3,
    },
    features: [
      '500 contacts',
      '1 channel',
      '1,000 messages/month',
      '5 flows',
      'Basic analytics',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 15,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? '',
    limits: {
      contacts: 10_000,
      channels: 5,
      messagesPerMonth: 50_000,
      teamMembers: 10,
      liveChatSeats: 3,
      flows: 50,
      broadcasts: -1,
    },
    features: [
      '10,000 contacts',
      '5 channels',
      '50,000 messages/month',
      'Unlimited flows',
      'AI features',
      'Advanced analytics',
      '3 live chat seats',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '',
    limits: {
      contacts: -1,
      channels: -1,
      messagesPerMonth: -1,
      teamMembers: -1,
      liveChatSeats: -1,
      flows: -1,
      broadcasts: -1,
    },
    features: [
      'Unlimited contacts',
      'Unlimited channels',
      'Unlimited messages',
      'Unlimited flows',
      'All AI features',
      'Priority support',
      'Unlimited live chat seats',
      'Custom integrations',
    ],
  },
}

export function getPlan(planId: string): PlanDefinition {
  return PLANS[planId] ?? PLANS.free
}

export function checkLimit(
  plan: PlanDefinition,
  resource: keyof PlanDefinition['limits'],
  currentUsage: number,
): boolean {
  const limit = plan.limits[resource]
  if (limit === -1) return true
  return currentUsage < limit
}
