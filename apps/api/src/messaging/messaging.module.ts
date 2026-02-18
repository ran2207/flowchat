import { Module } from '@nestjs/common'
import { IncomingMessageProcessor } from './processors/incoming-message.processor'
import { OutgoingMessageProcessor } from './processors/outgoing-message.processor'
import { FlowExecutionProcessor } from './processors/flow-execution.processor'
import { FlowTriggerService } from './services/flow-trigger.service'
import { ContactService } from './services/contact.service'
import { ConversationService } from './services/conversation.service'
import { MessageService } from './services/message.service'
import { WebhooksModule } from '../webhooks/webhooks.module'

@Module({
  imports: [WebhooksModule],
  providers: [
    IncomingMessageProcessor,
    OutgoingMessageProcessor,
    FlowExecutionProcessor,
    FlowTriggerService,
    ContactService,
    ConversationService,
    MessageService,
  ],
  exports: [
    FlowTriggerService,
    ContactService,
    ConversationService,
    MessageService,
  ],
})
export class MessagingModule {}
