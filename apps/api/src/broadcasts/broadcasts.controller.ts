import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import {
  IsString,
  IsOptional,
  IsObject,
  IsDateString,
  IsArray,
} from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { BroadcastsService } from './broadcasts.service'

class CreateBroadcastDto {
  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  channelId?: string

  @IsObject()
  content!: Record<string, unknown>

  @IsObject()
  @IsOptional()
  audienceFilter?: {
    tags?: string[]
    platforms?: string[]
    isSubscribed?: boolean
    customFields?: Array<{ key: string; operator: string; value: string }>
  }

  @IsDateString()
  @IsOptional()
  scheduledAt?: string
}

class UpdateBroadcastDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  channelId?: string

  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  audienceFilter?: {
    tags?: string[]
    platforms?: string[]
    isSubscribed?: boolean
    customFields?: Array<{ key: string; operator: string; value: string }>
  }

  @IsDateString()
  @IsOptional()
  scheduledAt?: string | null
}

class AudienceCountDto {
  @IsArray()
  @IsOptional()
  tags?: string[]

  @IsArray()
  @IsOptional()
  platforms?: string[]
}

@ApiTags('Broadcasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new broadcast' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateBroadcastDto,
  ) {
    return this.broadcastsService.create(user.tenantId, {
      name: dto.name,
      channelId: dto.channelId,
      content: dto.content,
      audienceFilter: dto.audienceFilter,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      createdById: user.userId,
    })
  }

  @Get()
  @ApiOperation({ summary: 'List broadcasts' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.broadcastsService.findAll(user.tenantId, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get broadcast details' })
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.findOne(user.tenantId, id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a broadcast' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBroadcastDto,
  ) {
    return this.broadcastsService.update(user.tenantId, id, {
      name: dto.name,
      channelId: dto.channelId,
      content: dto.content,
      audienceFilter: dto.audienceFilter,
      scheduledAt: dto.scheduledAt === null
        ? null
        : dto.scheduledAt
          ? new Date(dto.scheduledAt)
          : undefined,
    })
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a broadcast' })
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.delete(user.tenantId, id)
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send a broadcast immediately' })
  send(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.broadcastsService.send(user.tenantId, id)
  }

  @Post('audience-count')
  @ApiOperation({ summary: 'Get audience count for a filter' })
  audienceCount(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AudienceCountDto,
  ) {
    return this.broadcastsService.getAudienceCount(user.tenantId, dto)
  }
}
