import { Global, Module } from '@nestjs/common'
import { IntegrationsService } from './integrations.service'
import { IntegrationsController } from './integrations.controller'

@Global()
@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
