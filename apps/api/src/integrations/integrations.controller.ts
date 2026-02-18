import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { IntegrationsService } from './integrations.service'

class CreateWebhookDto {
  @IsString()
  name!: string

  @IsString()
  url!: string

  @IsArray()
  @IsString({ each: true })
  events!: string[]
}

class UpdateWebhookDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  url?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  events?: string[]

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

class ZapierConfigDto {
  @IsString()
  webhookUrl!: string

  @IsArray()
  @IsString({ each: true })
  events!: string[]
}

class GoogleSheetsConfigDto {
  @IsString()
  accessToken!: string

  @IsString()
  refreshToken!: string

  @IsString()
  spreadsheetId!: string
}

@ApiTags('Integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  // ─── Outgoing Webhooks ─────────────────────────────────────

  @Get('webhooks')
  @ApiOperation({ summary: 'List outgoing webhooks' })
  listWebhooks(@CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.listWebhooks(user.tenantId)
  }

  @Post('webhooks')
  @ApiOperation({ summary: 'Create an outgoing webhook' })
  createWebhook(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.integrationsService.createWebhook(
      user.tenantId,
      dto.name,
      dto.url,
      dto.events,
    )
  }

  @Patch('webhooks/:id')
  @ApiOperation({ summary: 'Update a webhook' })
  updateWebhook(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.integrationsService.updateWebhook(user.tenantId, id, dto)
  }

  @Delete('webhooks/:id')
  @ApiOperation({ summary: 'Delete a webhook' })
  deleteWebhook(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.integrationsService.deleteWebhook(user.tenantId, id)
  }

  @Post('webhooks/:id/test')
  @ApiOperation({ summary: 'Send a test webhook' })
  testWebhook(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.integrationsService.testWebhook(user.tenantId, id)
  }

  // ─── Zapier ────────────────────────────────────────────────

  @Get('zapier')
  @ApiOperation({ summary: 'Get Zapier configuration' })
  getZapierConfig(@CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.getZapierConfig(user.tenantId)
  }

  @Post('zapier')
  @ApiOperation({ summary: 'Configure Zapier integration' })
  configureZapier(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ZapierConfigDto,
  ) {
    return this.integrationsService.configureZapier(
      user.tenantId,
      dto.webhookUrl,
      dto.events,
    )
  }

  @Delete('zapier')
  @ApiOperation({ summary: 'Disconnect Zapier' })
  disconnectZapier(@CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.disconnectZapier(user.tenantId)
  }

  // ─── Google Sheets ─────────────────────────────────────────

  @Get('google-sheets')
  @ApiOperation({ summary: 'Get Google Sheets configuration' })
  getGoogleSheets(@CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.getGoogleSheetsConfig(user.tenantId)
  }

  @Post('google-sheets')
  @ApiOperation({ summary: 'Configure Google Sheets integration' })
  configureGoogleSheets(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GoogleSheetsConfigDto,
  ) {
    return this.integrationsService.configureGoogleSheets(
      user.tenantId,
      dto.accessToken,
      dto.refreshToken,
      dto.spreadsheetId,
    )
  }

  @Delete('google-sheets')
  @ApiOperation({ summary: 'Disconnect Google Sheets' })
  disconnectGoogleSheets(@CurrentUser() user: CurrentUserPayload) {
    return this.integrationsService.disconnectGoogleSheets(user.tenantId)
  }
}
