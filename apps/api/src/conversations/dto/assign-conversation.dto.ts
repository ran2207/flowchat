import { IsString, IsOptional } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AssignConversationDto {
  @ApiProperty({ description: 'Agent user ID to assign. Omit or null to unassign.' })
  @IsString()
  @IsOptional()
  agentId?: string | null
}
