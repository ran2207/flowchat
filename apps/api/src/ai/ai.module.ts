import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AiService } from './ai.service'
import { OpenAiProvider } from './providers/openai.provider'
import { AnthropicProvider } from './providers/anthropic.provider'
import { IntentService } from './services/intent.service'
import { KnowledgeBaseService } from './services/knowledge-base.service'
import { AutoReplyService } from './services/auto-reply.service'
import { FlowAssistantService } from './services/flow-assistant.service'
import { TextImproverService } from './services/text-improver.service'
import { AiController } from './ai.controller'

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [
    AiService,
    OpenAiProvider,
    AnthropicProvider,
    IntentService,
    KnowledgeBaseService,
    AutoReplyService,
    FlowAssistantService,
    TextImproverService,
  ],
  exports: [
    AiService,
    IntentService,
    KnowledgeBaseService,
    AutoReplyService,
    FlowAssistantService,
    TextImproverService,
  ],
})
export class AiModule {}
