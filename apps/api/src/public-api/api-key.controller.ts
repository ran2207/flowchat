import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsOptional, IsArray, IsNumber, Min, Max } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { ApiKeyService } from './api-key.service'

class CreateApiKeyDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[]

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  rateLimit?: number
}

@ApiTags('API Keys')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Create an API key' })
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeyService.createKey(
      user.tenantId,
      dto.name,
      dto.permissions,
      dto.rateLimit,
    )
  }

  @Get()
  @ApiOperation({ summary: 'List API keys' })
  list(@CurrentUser() user: CurrentUserPayload) {
    return this.apiKeyService.listKeys(user.tenantId)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  revoke(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.apiKeyService.revokeKey(user.tenantId, id)
  }
}
