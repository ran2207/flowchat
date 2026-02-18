import { IsString, IsObject, IsOptional, IsIn } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

const SUPPORTED_PLATFORMS = [
  'telegram',
  'instagram',
  'facebook',
  'whatsapp',
  'tiktok',
  'sms',
  'email',
] as const

export class CreateChannelDto {
  @ApiProperty({ enum: SUPPORTED_PLATFORMS })
  @IsString()
  @IsIn(SUPPORTED_PLATFORMS)
  platform!: string

  @ApiProperty({ description: 'Display name for this channel' })
  @IsString()
  name!: string

  @ApiProperty({ description: 'Platform-specific credentials (e.g. bot token)' })
  @IsObject()
  credentials!: Record<string, unknown>

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>
}
