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
import { IsString, IsOptional, IsArray } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { SequencesService, type SequenceStep } from './sequences.service'

class CreateSequenceDto {
  @IsString()
  name!: string

  @IsArray()
  @IsOptional()
  steps?: SequenceStep[]
}

class UpdateSequenceDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsArray()
  @IsOptional()
  steps?: SequenceStep[]

  @IsString()
  @IsOptional()
  status?: string
}

class SubscribeDto {
  @IsString()
  contactId!: string
}

class BulkSubscribeDto {
  @IsArray()
  contactIds!: string[]
}

@ApiTags('Sequences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sequences')
export class SequencesController {
  constructor(private readonly sequencesService: SequencesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sequence' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSequenceDto,
  ) {
    return this.sequencesService.create(user.tenantId, dto)
  }

  @Get()
  @ApiOperation({ summary: 'List sequences' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sequencesService.findAll(user.tenantId, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sequence details' })
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.sequencesService.findOne(user.tenantId, id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a sequence' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSequenceDto,
  ) {
    return this.sequencesService.update(user.tenantId, id, dto)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a sequence' })
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.sequencesService.delete(user.tenantId, id)
  }

  @Post(':id/subscribe')
  @ApiOperation({ summary: 'Subscribe a contact to a sequence' })
  subscribe(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.sequencesService.subscribe(
      user.tenantId,
      id,
      dto.contactId,
    )
  }

  @Post(':id/unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe a contact from a sequence' })
  unsubscribe(
    @Param('id') id: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.sequencesService.unsubscribe(id, dto.contactId)
  }

  @Post(':id/subscribe/bulk')
  @ApiOperation({ summary: 'Bulk subscribe contacts to a sequence' })
  bulkSubscribe(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: BulkSubscribeDto,
  ) {
    return this.sequencesService.bulkSubscribe(
      user.tenantId,
      id,
      dto.contactIds,
    )
  }

  @Get(':id/subscriptions')
  @ApiOperation({ summary: 'List subscriptions for a sequence' })
  getSubscriptions(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.sequencesService.getSubscriptions(user.tenantId, id, {
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    })
  }
}
