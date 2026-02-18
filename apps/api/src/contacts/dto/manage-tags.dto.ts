import { IsArray, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class ManageTagsDto {
  @ApiProperty({ description: 'List of tag names to add or remove' })
  @IsArray()
  @IsString({ each: true })
  tags!: string[]
}
