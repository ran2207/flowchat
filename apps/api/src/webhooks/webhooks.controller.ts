import {
  Controller,
  Post,
  Param,
  Req,
  Res,
  Logger,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger'
import { Request, Response } from 'express'
import { WebhooksService } from './webhooks.service'

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('telegram/:channelId')
  @ApiOperation({ summary: 'Receive Telegram webhook events' })
  async handleTelegram(
    @Param('channelId') channelId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK).json({ ok: true })

    try {
      const rawBody =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

      await this.webhooksService.handleIncomingWebhook(
        'telegram',
        channelId,
        req.headers as Record<string, string>,
        rawBody,
        req.body,
      )
    } catch (error) {
      this.logger.error(
        `Error processing Telegram webhook for channel ${channelId}`,
        error instanceof Error ? error.stack : String(error),
      )
    }
  }

  @Post('instagram/:channelId')
  @ApiExcludeEndpoint()
  async handleInstagram(
    @Param('channelId') channelId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK).json({ ok: true })

    try {
      const rawBody =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

      await this.webhooksService.handleIncomingWebhook(
        'instagram',
        channelId,
        req.headers as Record<string, string>,
        rawBody,
        req.body,
      )
    } catch (error) {
      this.logger.error(
        `Error processing Instagram webhook for channel ${channelId}`,
        error instanceof Error ? error.stack : String(error),
      )
    }
  }

  @Post('facebook/:channelId')
  @ApiExcludeEndpoint()
  async handleFacebook(
    @Param('channelId') channelId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK).json({ ok: true })

    try {
      const rawBody =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

      await this.webhooksService.handleIncomingWebhook(
        'facebook',
        channelId,
        req.headers as Record<string, string>,
        rawBody,
        req.body,
      )
    } catch (error) {
      this.logger.error(
        `Error processing Facebook webhook for channel ${channelId}`,
        error instanceof Error ? error.stack : String(error),
      )
    }
  }

  @Post('whatsapp/:channelId')
  @ApiExcludeEndpoint()
  async handleWhatsApp(
    @Param('channelId') channelId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    res.status(HttpStatus.OK).json({ ok: true })

    try {
      const rawBody =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

      await this.webhooksService.handleIncomingWebhook(
        'whatsapp',
        channelId,
        req.headers as Record<string, string>,
        rawBody,
        req.body,
      )
    } catch (error) {
      this.logger.error(
        `Error processing WhatsApp webhook for channel ${channelId}`,
        error instanceof Error ? error.stack : String(error),
      )
    }
  }
}
