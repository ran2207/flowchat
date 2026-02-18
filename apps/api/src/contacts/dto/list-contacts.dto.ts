import { IsOptional, IsString, IsInt, Min, Max, IsArray } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { Type, Transform } from 'class-transformer'

export class ListContactsDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  platform?: string

  @ApiProperty({ required: false, description: 'Comma-separated tag names' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @ApiProperty({ required: false, enum: ['subscribed', 'unsubscribed', 'all'] })
  @IsString()
  @IsOptional()
  subscriptionStatus?: string

  @ApiProperty({ required: false, default: 'lastInteractionAt' })
  @IsString()
  @IsOptional()
  sortBy?: string

  @ApiProperty({ required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc'

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
