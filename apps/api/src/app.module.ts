import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { HealthModule } from './health/health.module'
import { AuthModule } from './auth/auth.module'
import { FlowsModule } from './flows/flows.module'
import { ChannelsModule } from './channels/channels.module'
import { WebhooksModule } from './webhooks/webhooks.module'
import { QueueModule } from './queue/queue.module'
import { MessagingModule } from './messaging/messaging.module'

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
  ],
})
export class AppModule {}
