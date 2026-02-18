import { IsString, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

const VALID_STATUSES = ['open', 'pending', 'resolved', 'closed'] as const

export class UpdateConversationStatusDto {
  @ApiProperty({ enum: VALID_STATUSES })
  @IsString()
  @IsIn(VALID_STATUSES)
  status!: string
}
