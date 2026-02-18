import { IsString, IsOptional, IsBoolean } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SendMessageDto {
  @ApiProperty({ description: 'Message text content' })
  @IsString()
  text!: string

  @ApiProperty({ required: false, description: 'If true, stores as internal note (not sent to contact)' })
  @IsBoolean()
  @IsOptional()
  isNote?: boolean
}
