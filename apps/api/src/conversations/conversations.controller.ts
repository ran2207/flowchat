import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { ConversationsService } from './conversations.service'
import { ListConversationsDto } from './dto/list-conversations.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { AssignConversationDto } from './dto/assign-conversation.dto'
import { UpdateConversationStatusDto } from './dto/update-conversation-status.dto'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../common/decorators/current-user.decorator'
import { LiveChatGateway } from '../gateway/live-chat.gateway'

@ApiTags('Conversations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(
    private readonly conversationsService: ConversationsService,
    private readonly liveChatGateway: LiveChatGateway,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List conversations with filters' })
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query() dto: ListConversationsDto,
  ) {
    return this.conversationsService.findAll(user.tenantId, user.userId, dto)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a conversation with contact details' })
  findOne(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.conversationsService.findOne(user.tenantId, id)
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation' })
  getMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversationsService.getMessages(
      user.tenantId,
      id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    )
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a message in a conversation (or add a note)' })
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.conversationsService.sendMessage(
      user.tenantId,
      user.userId,
      id,
      dto.text,
      dto.isNote,
    )

    this.liveChatGateway.emitNewMessage(user.tenantId, id, message)

    return message
  }

  @Put(':id/assign')
  @ApiOperation({ summary: 'Assign or unassign an agent to a conversation' })
  async assign(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
  ) {
    const conversation = await this.conversationsService.assignAgent(
      user.tenantId,
      id,
      dto.agentId ?? null,
    )

    if (dto.agentId) {
      this.liveChatGateway.emitConversationAssigned(
        user.tenantId,
        id,
        dto.agentId,
      )
    }

    return conversation
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update conversation status' })
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateConversationStatusDto,
  ) {
    return this.conversationsService.updateStatus(user.tenantId, id, dto.status)
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark conversation as read' })
  markRead(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.conversationsService.markRead(user.tenantId, id)
  }
}
