import { IsString, IsObject, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateChannelDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  credentials?: Record<string, unknown>

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>
}
