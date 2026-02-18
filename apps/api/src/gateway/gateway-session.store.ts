import { Injectable } from '@nestjs/common'

export interface ConnectedAgent {
  socketId: string
  userId: string
  tenantId: string
  role: string
  connectedAt: Date
}

@Injectable()
export class GatewaySessionStore {
  private readonly sessions = new Map<string, ConnectedAgent>()

  addSession(socketId: string, agent: Omit<ConnectedAgent, 'socketId' | 'connectedAt'>) {
    this.sessions.set(socketId, {
      ...agent,
      socketId,
      connectedAt: new Date(),
    })
  }

  removeSession(socketId: string) {
    this.sessions.delete(socketId)
  }

  getSession(socketId: string): ConnectedAgent | undefined {
    return this.sessions.get(socketId)
  }

  getAgentSockets(userId: string): string[] {
    const sockets: string[] = []
    for (const [socketId, session] of this.sessions) {
      if (session.userId === userId) {
        sockets.push(socketId)
      }
    }
    return sockets
  }

  getTenantSockets(tenantId: string): string[] {
    const sockets: string[] = []
    for (const [socketId, session] of this.sessions) {
      if (session.tenantId === tenantId) {
        sockets.push(socketId)
      }
    }
    return sockets
  }

  getOnlineAgentCount(tenantId: string): number {
    const uniqueUserIds = new Set<string>()
    for (const session of this.sessions.values()) {
      if (session.tenantId === tenantId) {
        uniqueUserIds.add(session.userId)
      }
    }
    return uniqueUserIds.size
  }
}
