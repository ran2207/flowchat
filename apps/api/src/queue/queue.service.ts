import { Injectable, Inject, OnModuleDestroy, Logger } from '@nestjs/common'
import { Queue, type ConnectionOptions } from 'bullmq'

export const QUEUE_NAMES = {
  INCOMING_MESSAGES: 'incoming-messages',
  OUTGOING_MESSAGES: 'outgoing-messages',
  FLOW_EXECUTIONS: 'flow-executions',
  SCHEDULED_MESSAGES: 'scheduled-messages',
  WEBHOOK_EVENTS: 'webhook-events',
  ANALYTICS_EVENTS: 'analytics-events',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name)
  private readonly queues = new Map<string, Queue>()

  constructor(
    @Inject('REDIS_CONNECTION')
    private readonly redisConnection: ConnectionOptions,
  ) {}

  getQueue(name: QueueName): Queue {
    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.redisConnection,
        defaultJobOptions: {
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      })
      this.queues.set(name, queue)
    }

    return this.queues.get(name)!
  }

  async addJob<T>(
    queueName: QueueName,
    jobName: string,
    data: T,
    opts?: { delay?: number; priority?: number },
  ): Promise<string> {
    const queue = this.getQueue(queueName)
    const job = await queue.add(jobName, data, {
      delay: opts?.delay,
      priority: opts?.priority,
    })
    this.logger.debug(`Job ${job.id} added to ${queueName}`)
    return job.id!
  }

  async onModuleDestroy(): Promise<void> {
    const closePromises = Array.from(this.queues.values()).map((queue) =>
      queue.close(),
    )
    await Promise.all(closePromises)
    this.logger.log('All queues closed')
  }
}
