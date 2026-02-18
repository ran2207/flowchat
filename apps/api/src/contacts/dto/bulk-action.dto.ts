import { IsArray, IsString, IsIn, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class BulkActionDto {
  @ApiProperty({ description: 'Contact IDs to apply action to' })
  @IsArray()
  @IsString({ each: true })
  contactIds!: string[]

  @ApiProperty({ enum: ['add_tag', 'remove_tag', 'subscribe', 'unsubscribe', 'delete'] })
  @IsString()
  @IsIn(['add_tag', 'remove_tag', 'subscribe', 'unsubscribe', 'delete'])
  action!: string

  @ApiProperty({ required: false, description: 'Tag name (for add_tag / remove_tag actions)' })
  @IsString()
  @IsOptional()
  tagName?: string
}
