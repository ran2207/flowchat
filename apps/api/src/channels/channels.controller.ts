import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ChannelsService } from './channels.service'
import { CreateChannelDto } from './dto/create-channel.dto'
import { UpdateChannelDto } from './dto/update-channel.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../common/decorators/current-user.decorator'

@ApiTags('Channels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @ApiOperation({ summary: 'List all connected channels' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.channelsService.findAll(user.tenantId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a channel by ID' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.channelsService.findOne(user.tenantId, id)
  }

  @Post()
  @ApiOperation({ summary: 'Connect a new channel' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateChannelDto) {
    return this.channelsService.create(user.tenantId, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update channel settings' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.channelsService.update(user.tenantId, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disconnect a channel' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.channelsService.remove(user.tenantId, id)
  }
}
