import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { ApiKeyService } from './api-key.service'

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()
    const apiKey = this.extractApiKey(request)

    if (!apiKey) {
      throw new UnauthorizedException('Missing API key. Provide X-API-Key header.')
    }

    const keyData = await this.apiKeyService.validateKey(apiKey)

    if (!keyData) {
      throw new UnauthorizedException('Invalid or expired API key')
    }

    ;(request as unknown as Record<string, unknown>)['apiKeyData'] = keyData

    return true
  }

  private extractApiKey(request: Request): string | undefined {
    return (
      (request.headers['x-api-key'] as string) ??
      request.query['api_key'] as string ??
      undefined
    )
  }
}
