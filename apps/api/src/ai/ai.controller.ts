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
import { IsString, IsOptional, IsArray, IsObject, IsIn, IsBoolean } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser, type CurrentUserPayload } from '../common/decorators/current-user.decorator'
import { IntentService } from './services/intent.service'
import { KnowledgeBaseService } from './services/knowledge-base.service'
import { AutoReplyService } from './services/auto-reply.service'
import { FlowAssistantService } from './services/flow-assistant.service'
import { TextImproverService, type TextImproveMode } from './services/text-improver.service'
import { AiService } from './ai.service'
import type { AiProvider, IntentDefinition } from './ai.types'

class MatchIntentDto {
  @IsString()
  message!: string

  @IsArray()
  intents!: IntentDefinition[]

  @IsString()
  @IsOptional()
  provider?: AiProvider
}

class AutoReplyDto {
  @IsString()
  message!: string

  @IsArray()
  @IsOptional()
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
}

class UpdateAutoReplyConfigDto {
  @IsBoolean()
  @IsOptional()
  enabled?: boolean

  @IsString()
  @IsOptional()
  provider?: AiProvider

  @IsString()
  @IsOptional()
  model?: string

  @IsString()
  @IsOptional()
  tone?: string

  @IsString()
  @IsOptional()
  personality?: string

  @IsArray()
  @IsOptional()
  guardrails?: string[]
}

class AddKnowledgeDto {
  @IsString()
  @IsIn(['url', 'document', 'faq', 'text'])
  type!: string

  @IsString()
  title!: string

  @IsString()
  content!: string

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>
}

class GenerateFlowDto {
  @IsString()
  description!: string

  @IsString()
  @IsOptional()
  provider?: AiProvider
}

class RefineFlowDto {
  @IsObject()
  currentFlow!: Record<string, unknown>

  @IsString()
  instruction!: string

  @IsString()
  @IsOptional()
  provider?: AiProvider
}

class ImproveTextDto {
  @IsString()
  text!: string

  @IsString()
  @IsIn([
    'professional',
    'casual',
    'formal',
    'friendly',
    'concise',
    'expand',
    'fix_grammar',
    'translate',
  ])
  mode!: TextImproveMode

  @IsString()
  @IsOptional()
  provider?: AiProvider

  @IsString()
  @IsOptional()
  brandVoice?: string

  @IsString()
  @IsOptional()
  targetLanguage?: string
}

class GenerateVariationsDto {
  @IsString()
  text!: string

  @IsOptional()
  count?: number

  @IsString()
  @IsOptional()
  provider?: AiProvider
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly intentService: IntentService,
    private readonly knowledgeBase: KnowledgeBaseService,
    private readonly autoReply: AutoReplyService,
    private readonly flowAssistant: FlowAssistantService,
    private readonly textImprover: TextImproverService,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Check AI provider availability' })
  getStatus() {
    return {
      openai: this.aiService.isProviderConfigured('openai'),
      anthropic: this.aiService.isProviderConfigured('anthropic'),
    }
  }

  // --- Intent Recognition ---

  @Post('intent/match')
  @ApiOperation({ summary: 'Match a message to defined intents' })
  matchIntent(
    @Body() dto: MatchIntentDto,
  ) {
    return this.intentService.matchIntent(
      dto.message,
      dto.intents,
      dto.provider,
    )
  }

  // --- Knowledge Base ---

  @Get('knowledge')
  @ApiOperation({ summary: 'List knowledge base entries' })
  listKnowledge(@CurrentUser() user: CurrentUserPayload) {
    return this.knowledgeBase.listEntries(user.tenantId)
  }

  @Post('knowledge')
  @ApiOperation({ summary: 'Add a knowledge base entry' })
  addKnowledge(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddKnowledgeDto,
  ) {
    return this.knowledgeBase.addEntry(
      user.tenantId,
      dto.type,
      dto.title,
      dto.content,
      dto.metadata,
    )
  }

  @Delete('knowledge/:id')
  @ApiOperation({ summary: 'Remove a knowledge base entry' })
  removeKnowledge(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.knowledgeBase.removeEntry(user.tenantId, id)
  }

  // --- Auto Reply ---

  @Get('auto-reply/config')
  @ApiOperation({ summary: 'Get auto-reply configuration' })
  getAutoReplyConfig(@CurrentUser() user: CurrentUserPayload) {
    return this.autoReply.getConfig(user.tenantId)
  }

  @Post('auto-reply/config')
  @ApiOperation({ summary: 'Update auto-reply configuration' })
  updateAutoReplyConfig(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateAutoReplyConfigDto,
  ) {
    return this.autoReply.updateConfig(user.tenantId, dto)
  }

  @Post('auto-reply/generate')
  @ApiOperation({ summary: 'Generate an auto-reply for a message' })
  generateAutoReply(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AutoReplyDto,
  ) {
    return this.autoReply.generateReply(
      user.tenantId,
      dto.message,
      dto.conversationHistory ?? [],
    )
  }

  // --- Flow Assistant ---

  @Post('flow/generate')
  @ApiOperation({ summary: 'Generate a flow from natural language description' })
  generateFlow(@Body() dto: GenerateFlowDto) {
    return this.flowAssistant.generateFlow(dto.description, dto.provider)
  }

  @Post('flow/refine')
  @ApiOperation({ summary: 'Refine an existing flow with instructions' })
  refineFlow(@Body() dto: RefineFlowDto) {
    return this.flowAssistant.refineFlow(
      dto.currentFlow as unknown as Parameters<typeof this.flowAssistant.refineFlow>[0],
      dto.instruction,
      dto.provider,
    )
  }

  // --- Text Improver ---

  @Post('text/improve')
  @ApiOperation({ summary: 'Improve text with selected mode' })
  improveText(@Body() dto: ImproveTextDto) {
    return this.textImprover.improve(dto.text, dto.mode, {
      provider: dto.provider,
      brandVoice: dto.brandVoice,
      targetLanguage: dto.targetLanguage,
    })
  }

  @Post('text/variations')
  @ApiOperation({ summary: 'Generate message variations' })
  generateVariations(@Body() dto: GenerateVariationsDto) {
    return this.textImprover.generateVariations(
      dto.text,
      dto.count,
      dto.provider,
    )
  }
}
