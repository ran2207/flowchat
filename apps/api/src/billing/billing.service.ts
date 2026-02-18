import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { prisma } from '@flowchat/database'
import Stripe from 'stripe'
import { getPlan, PLANS, type PlanDefinition } from './plans'

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)
  private stripe: Stripe | null = null

  constructor(private readonly configService: ConfigService) {}

  private getStripe(): Stripe {
    if (!this.stripe) {
      const key = this.configService.get<string>('STRIPE_SECRET_KEY')
      if (!key) throw new Error('STRIPE_SECRET_KEY not configured')
      this.stripe = new Stripe(key, { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion })
    }
    return this.stripe
  }

  isConfigured(): boolean {
    return !!this.configService.get<string>('STRIPE_SECRET_KEY')
  }

  async getCurrentPlan(tenantId: string): Promise<{
    plan: PlanDefinition
    usage: { contacts: number; messagesThisMonth: number }
    subscriptionStatus: string
  }> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    })

    const plan = getPlan(tenant.plan)

    const contacts = await prisma.contact.count({
      where: { tenantId, deletedAt: null },
    })

    return {
      plan,
      usage: {
        contacts,
        messagesThisMonth: tenant.messagesUsedMonth,
      },
      subscriptionStatus: tenant.subscriptionStatus,
    }
  }

  getPlans(): PlanDefinition[] {
    return Object.values(PLANS)
  }

  async createCheckoutSession(
    tenantId: string,
    planId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ url: string }> {
    const stripe = this.getStripe()
    const plan = getPlan(planId)

    if (!plan.stripePriceId) {
      throw new BadRequestException('Cannot checkout for this plan')
    }

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    })

    let customerId = tenant.stripeCustomerId

    if (!customerId) {
      const owner = await prisma.user.findFirst({
        where: { tenantId, role: 'owner' },
        select: { email: true },
      })

      const customer = await stripe.customers.create({
        metadata: { tenantId },
        email: owner?.email,
        name: tenant.name,
      })

      customerId = customer.id

      await prisma.tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tenantId, planId },
    })

    return { url: session.url! }
  }

  async createPortalSession(
    tenantId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const stripe = this.getStripe()

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
    })

    if (!tenant.stripeCustomerId) {
      throw new BadRequestException('No billing account found')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: returnUrl,
    })

    return { url: session.url }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const tenantId = session.metadata?.tenantId
        const planId = session.metadata?.planId
        if (tenantId && planId) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              plan: planId,
              subscriptionStatus: 'active',
            },
          })
          this.logger.log(`Tenant ${tenantId} upgraded to ${planId}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              subscriptionStatus: subscription.status,
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId =
          typeof subscription.customer === 'string'
            ? subscription.customer
            : subscription.customer.id
        const tenant = await prisma.tenant.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (tenant) {
          await prisma.tenant.update({
            where: { id: tenant.id },
            data: {
              plan: 'free',
              subscriptionStatus: 'canceled',
            },
          })
          this.logger.log(`Tenant ${tenant.id} subscription canceled, reverted to free`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId =
          typeof invoice.customer === 'string'
            ? invoice.customer
            : invoice.customer?.id
        if (customerId) {
          const tenant = await prisma.tenant.findFirst({
            where: { stripeCustomerId: customerId },
          })
          if (tenant) {
            await prisma.tenant.update({
              where: { id: tenant.id },
              data: { subscriptionStatus: 'past_due' },
            })
            this.logger.warn(`Payment failed for tenant ${tenant.id}`)
          }
        }
        break
      }

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`)
    }
  }

  async incrementMessageUsage(tenantId: string, count: number = 1): Promise<void> {
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { messagesUsedMonth: { increment: count } },
    })
  }

  async resetMonthlyUsage(): Promise<number> {
    const result = await prisma.tenant.updateMany({
      data: { messagesUsedMonth: 0 },
    })
    this.logger.log(`Reset monthly usage for ${result.count} tenants`)
    return result.count
  }
}
