import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ example: 'My Business' })
  @IsString()
  @IsNotEmpty()
  businessName: string

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'securePassword123' })
  @IsString()
  @MinLength(8)
  password: string
}
