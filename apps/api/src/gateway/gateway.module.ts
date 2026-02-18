import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { LiveChatGateway } from './live-chat.gateway'
import { GatewaySessionStore } from './gateway-session.store'

@Module({
  imports: [AuthModule],
  providers: [LiveChatGateway, GatewaySessionStore],
  exports: [LiveChatGateway, GatewaySessionStore],
})
export class GatewayModule {}
