import { IsOptional, IsString, IsObject } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateFlowDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  triggerType?: string

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  triggerConfig?: Record<string, unknown>

  @ApiProperty({ required: false, description: 'Full flow definition (nodes, edges, variables)' })
  @IsObject()
  @IsOptional()
  definition?: Record<string, unknown>
}
