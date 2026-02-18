import { IsOptional, IsString, IsEmail, IsObject } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateContactDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  timezone?: string

  @ApiProperty({ required: false, description: 'Merge into custom fields (does not replace all)' })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, unknown>
}
