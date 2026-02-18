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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { FlowsService } from './flows.service'
import { CreateFlowDto } from './dto/create-flow.dto'
import { UpdateFlowDto } from './dto/update-flow.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../common/decorators/current-user.decorator'

@ApiTags('Flows')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('flows')
export class FlowsController {
  constructor(private readonly flowsService: FlowsService) {}

  @Get()
  @ApiOperation({ summary: 'List all flows' })
  findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.flowsService.findAll(user.tenantId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a flow by ID' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.flowsService.findOne(user.tenantId, id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new flow' })
  @ApiResponse({ status: 201, description: 'Flow created' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateFlowDto) {
    return this.flowsService.create(user.tenantId, user.userId, dto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a flow' })
  update(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateFlowDto,
  ) {
    return this.flowsService.update(user.tenantId, id, user.userId, dto)
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a flow' })
  publish(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.flowsService.publish(user.tenantId, id, user.userId)
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive a flow' })
  archive(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.flowsService.archive(user.tenantId, id)
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate a flow' })
  duplicate(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.flowsService.duplicate(user.tenantId, id, user.userId)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete a flow' })
  remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.flowsService.remove(user.tenantId, id)
  }
}
