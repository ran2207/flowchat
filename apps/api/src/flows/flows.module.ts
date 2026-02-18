import { Module } from '@nestjs/common'
import { FlowsController } from './flows.controller'
import { FlowsService } from './flows.service'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [AuthModule],
  controllers: [FlowsController],
  providers: [FlowsService],
  exports: [FlowsService],
})
export class FlowsModule {}
