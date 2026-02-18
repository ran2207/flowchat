import { Module } from '@nestjs/common'
import { ApiKeyService } from './api-key.service'
import { ApiKeyGuard } from './api-key.guard'
import { ApiKeyController } from './api-key.controller'
import { PublicApiController } from './public-api.controller'

@Module({
  controllers: [ApiKeyController, PublicApiController],
  providers: [ApiKeyService, ApiKeyGuard],
  exports: [ApiKeyService],
})
export class PublicApiModule {}
