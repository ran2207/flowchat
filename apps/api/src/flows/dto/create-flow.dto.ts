import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateFlowDto {
  @ApiProperty({ example: 'Welcome Flow' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: 'Greet new contacts', required: false })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ example: 'keyword' })
  @IsString()
  @IsNotEmpty()
  triggerType: string

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  triggerConfig?: Record<string, unknown>
}
