import { Module } from '@nestjs/common'
import { ConversationsController } from './conversations.controller'
import { ConversationsService } from './conversations.service'
import { AuthModule } from '../auth/auth.module'
import { GatewayModule } from '../gateway/gateway.module'

@Module({
  imports: [AuthModule, GatewayModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}
