import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Request } from 'express'

interface JwtPayload {
  sub: string
  tenantId: string
  role: string
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const token = this.extractTokenFromHeader(request)

    if (!token) {
      throw new UnauthorizedException('Missing authentication token')
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token)
      request['user'] = {
        userId: payload.sub,
        tenantId: payload.tenantId,
        role: payload.role,
      }
    } catch {
      throw new UnauthorizedException('Invalid authentication token')
    }

    return true
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }
}
