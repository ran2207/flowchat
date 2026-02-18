import { Module, Global } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { QueueService } from './queue.service'

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CONNECTION',
      useFactory: (configService: ConfigService) => {
        const useTls = configService.get<string>('REDIS_TLS', 'false') === 'true'
        return {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
          maxRetriesPerRequest: null,
          ...(useTls ? { tls: {} } : {}),
        }
      },
      inject: [ConfigService],
    },
    QueueService,
  ],
  exports: ['REDIS_CONNECTION', QueueService],
})
export class QueueModule {}
