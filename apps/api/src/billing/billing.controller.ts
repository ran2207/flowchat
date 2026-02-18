import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Headers,
  UseGuards,
  RawBodyRequest,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString } from 'class-validator'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import Stripe from 'stripe'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { BillingService } from './billing.service'

class CheckoutDto {
  @IsString()
  planId!: string

  @IsString()
  successUrl!: string

  @IsString()
  cancelUrl!: string
}

class PortalDto {
  @IsString()
  returnUrl!: string
}

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly configService: ConfigService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get available plans' })
  getPlans() {
    return this.billingService.getPlans()
  }

  @Get('current')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current plan and usage' })
  getCurrentPlan(@CurrentUser() user: CurrentUserPayload) {
    return this.billingService.getCurrentPlan(user.tenantId)
  }

  @Post('checkout')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe checkout session' })
  createCheckout(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CheckoutDto,
  ) {
    return this.billingService.createCheckoutSession(
      user.tenantId,
      dto.planId,
      dto.successUrl,
      dto.cancelUrl,
    )
  }

  @Post('portal')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a Stripe customer portal session' })
  createPortal(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PortalDto,
  ) {
    return this.billingService.createPortalSession(user.tenantId, dto.returnUrl)
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured')
    }

    const rawBody = req.rawBody
    if (!rawBody) {
      throw new BadRequestException('Missing raw body')
    }

    const stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY')!,
      { apiVersion: '2025-12-18.acacia' as Stripe.LatestApiVersion },
    )

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
    } catch {
      throw new BadRequestException('Invalid webhook signature')
    }

    await this.billingService.handleWebhookEvent(event)

    return { received: true }
  }
}
