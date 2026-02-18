import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { GrowthToolsService } from './growth-tools.service'

class GenerateQrDto {
  @IsString()
  platform!: string

  @IsString()
  url!: string

  @IsNumber()
  @IsOptional()
  size?: number
}

class CreateRefUrlDto {
  @IsString()
  name!: string

  @IsString()
  platform!: string

  @IsString()
  @IsOptional()
  channelId?: string
}

class UpdateWidgetDto {
  @IsString()
  @IsOptional()
  position?: 'bottom-right' | 'bottom-left'

  @IsString()
  @IsOptional()
  color?: string

  @IsString()
  @IsOptional()
  greeting?: string

  @IsArray()
  @IsOptional()
  channels?: Array<{ platform: string; url: string }>

  @IsBoolean()
  @IsOptional()
  showOnMobile?: boolean

  @IsNumber()
  @IsOptional()
  delay?: number
}

@ApiTags('Growth Tools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('growth')
export class GrowthToolsController {
  constructor(private readonly growthToolsService: GrowthToolsService) {}

  @Post('qr')
  @ApiOperation({ summary: 'Generate a QR code' })
  generateQr(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GenerateQrDto,
  ) {
    return this.growthToolsService.generateQrCode(user.tenantId, dto)
  }

  @Post('ref-url')
  @ApiOperation({ summary: 'Create a trackable ref URL' })
  createRefUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateRefUrlDto,
  ) {
    return this.growthToolsService.createRefUrl(user.tenantId, dto)
  }

  @Get('ref-url')
  @ApiOperation({ summary: 'List ref URLs' })
  listRefUrls(@CurrentUser() user: CurrentUserPayload) {
    return this.growthToolsService.listRefUrls(user.tenantId)
  }

  @Delete('ref-url/:id')
  @ApiOperation({ summary: 'Delete a ref URL' })
  deleteRefUrl(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.growthToolsService.deleteRefUrl(user.tenantId, id)
  }

  @Get('widget/config')
  @ApiOperation({ summary: 'Get widget configuration' })
  getWidgetConfig(@CurrentUser() user: CurrentUserPayload) {
    return this.growthToolsService.getWidgetConfig(user.tenantId)
  }

  @Post('widget/config')
  @ApiOperation({ summary: 'Update widget configuration' })
  updateWidgetConfig(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateWidgetDto,
  ) {
    return this.growthToolsService.updateWidgetConfig(user.tenantId, dto)
  }

  @Get('widget/script')
  @ApiOperation({ summary: 'Get embeddable widget script' })
  getWidgetScript(@CurrentUser() user: CurrentUserPayload) {
    return {
      script: this.growthToolsService.generateWidgetScript(user.tenantId),
    }
  }
}
