import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'
import { FlowsModule } from './flows/flows.module'
import { ChannelsModule } from './channels/channels.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { QueueModule } from './queue/queue.module'
import { MessagingModule } from './messaging/messaging.module'
import { GatewayModule } from './gateway/gateway.module'
import { ConversationsModule } from './conversations/conversations.module'
import { ContactsModule } from './contacts/contacts.module'
import { AiModule } from './ai/ai.module'
import { BroadcastsModule } from './broadcasts/broadcasts.module'
import { SequencesModule } from './sequences/sequences.module'
import { AnalyticsModule } from './analytics/analytics.module'
import { GrowthToolsModule } from './growth-tools/growth-tools.module'
import { BillingModule } from './billing/billing.module'
import { TeamModule } from './team/team.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    QueueModule,
    HealthModule,
    AuthModule,
    FlowsModule,
    ChannelsModule,
    WebhooksModule,
    MessagingModule,
    GatewayModule,
    ConversationsModule,
    ContactsModule,
    AiModule,
    BroadcastsModule,
    SequencesModule,
    AnalyticsModule,
    GrowthToolsModule,
    BillingModule,
    TeamModule,
  ],
})
export class AppModule {}
