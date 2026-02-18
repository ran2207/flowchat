import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets'
import { Logger } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Server, Socket } from 'socket.io'
import { GatewaySessionStore } from './gateway-session.store'

interface AuthPayload {
  sub: string
  tenantId: string
  role: string
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/live-chat',
})
export class LiveChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server

  private readonly logger = new Logger(LiveChatGateway.name)

  constructor(
    private readonly jwtService: JwtService,
    private readonly sessionStore: GatewaySessionStore,
  ) {}

  afterInit() {
    this.logger.log('Live chat gateway initialized')
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ??
        client.handshake.headers.authorization?.replace('Bearer ', '')

      if (!token) {
        client.disconnect()
        return
      }

      const payload = await this.jwtService.verifyAsync<AuthPayload>(token)

      this.sessionStore.addSession(client.id, {
        userId: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
      })

      await client.join(`tenant:${payload.tenantId}`)
      await client.join(`user:${payload.sub}`)

      this.logger.debug(
        `Agent ${payload.sub} connected (socket: ${client.id})`,
      )
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    const session = this.sessionStore.getSession(client.id)
    if (session) {
      this.sessionStore.removeSession(client.id)

      this.server
        .to(`tenant:${session.tenantId}`)
        .emit('agent:offline', { userId: session.userId })

      this.logger.debug(
        `Agent ${session.userId} disconnected (socket: ${client.id})`,
      )
    }
  }

  @SubscribeMessage('conversation:join')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.join(`conversation:${data.conversationId}`)
    return { event: 'conversation:joined', data: { conversationId: data.conversationId } }
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`)
    return { event: 'conversation:left', data: { conversationId: data.conversationId } }
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const session = this.sessionStore.getSession(client.id)
    if (!session) return

    client.to(`conversation:${data.conversationId}`).emit('typing:start', {
      conversationId: data.conversationId,
      userId: session.userId,
    })
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const session = this.sessionStore.getSession(client.id)
    if (!session) return

    client.to(`conversation:${data.conversationId}`).emit('typing:stop', {
      conversationId: data.conversationId,
      userId: session.userId,
    })
  }

  emitNewMessage(tenantId: string, conversationId: string, message: unknown) {
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message:new', message)

    this.server
      .to(`tenant:${tenantId}`)
      .emit('conversation:updated', { conversationId })
  }

  emitConversationAssigned(
    tenantId: string,
    conversationId: string,
    agentId: string,
  ) {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('conversation:assigned', { conversationId, agentId })

    this.server
      .to(`user:${agentId}`)
      .emit('conversation:assigned_to_me', { conversationId })
  }

  emitNewConversation(tenantId: string, conversation: unknown) {
    this.server
      .to(`tenant:${tenantId}`)
      .emit('conversation:new', conversation)
  }
}
