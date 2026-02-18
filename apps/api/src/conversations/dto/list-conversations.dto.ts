import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class ListConversationsDto {
  @ApiProperty({ required: false, enum: ['new', 'open', 'pending', 'resolved', 'closed'] })
  @IsString()
  @IsOptional()
  status?: string

  @ApiProperty({ required: false, description: 'Filter: assigned to this agent ID' })
  @IsString()
  @IsOptional()
  assignedTo?: string

  @ApiProperty({ required: false, description: 'Filter: "me" for current user, "unassigned" for none' })
  @IsString()
  @IsOptional()
  assignment?: 'me' | 'unassigned' | 'all'

  @ApiProperty({ required: false, description: 'Filter by channel ID' })
  @IsString()
  @IsOptional()
  channelId?: string

  @ApiProperty({ required: false, description: 'Search by contact name or message preview' })
  @IsString()
  @IsOptional()
  search?: string

  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number

  @ApiProperty({ required: false, default: 25 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number
}
