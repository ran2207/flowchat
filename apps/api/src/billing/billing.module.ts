import { Module, Global } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BillingService } from './billing.service'
import { BillingController } from './billing.controller'

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}
