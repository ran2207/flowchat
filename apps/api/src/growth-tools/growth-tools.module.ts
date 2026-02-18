import { Module } from '@nestjs/common'
import { GrowthToolsService } from './growth-tools.service'
import { GrowthToolsController } from './growth-tools.controller'

@Module({
  controllers: [GrowthToolsController],
  providers: [GrowthToolsService],
  exports: [GrowthToolsService],
})
export class GrowthToolsModule {}
