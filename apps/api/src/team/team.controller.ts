import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, IsIn } from 'class-validator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CurrentUser,
  type CurrentUserPayload,
} from '../common/decorators/current-user.decorator'
import { TeamService, ROLES, type Role } from './team.service'

class InviteDto {
  @IsString()
  email!: string

  @IsString()
  @IsIn(ROLES)
  role!: Role
}

class AcceptInviteDto {
  @IsString()
  token!: string

  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsString()
  password!: string
}

class UpdateRoleDto {
  @IsString()
  @IsIn(ROLES)
  role!: Role
}

class CancelInviteDto {
  @IsString()
  email!: string
}

@ApiTags('Team')
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get('members')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List team members' })
  getMembers(@CurrentUser() user: CurrentUserPayload) {
    return this.teamService.getMembers(user.tenantId)
  }

  @Get('members/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a team member' })
  getMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teamService.getMember(user.tenantId, id)
  }

  @Post('invite')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Invite a team member' })
  inviteMember(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: InviteDto,
  ) {
    return this.teamService.inviteMember(
      user.tenantId,
      user.userId,
      dto.email,
      dto.role,
    )
  }

  @Post('invite/accept')
  @ApiOperation({ summary: 'Accept a team invite' })
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.teamService.acceptInvite(dto.token, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      password: dto.password,
    })
  }

  @Get('invites')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List pending invites' })
  getPendingInvites(@CurrentUser() user: CurrentUserPayload) {
    return this.teamService.getPendingInvites(user.tenantId)
  }

  @Post('invite/cancel')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel a pending invite' })
  cancelInvite(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CancelInviteDto,
  ) {
    return this.teamService.cancelInvite(user.tenantId, dto.email)
  }

  @Patch('members/:id/role')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a member\'s role' })
  updateRole(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.teamService.updateRole(
      user.tenantId,
      user.userId,
      id,
      dto.role,
    )
  }

  @Delete('members/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a team member' })
  removeMember(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teamService.removeMember(user.tenantId, user.userId, id)
  }

  @Patch('members/:id/toggle-active')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle member active status' })
  toggleActive(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.teamService.toggleActive(user.tenantId, user.userId, id)
  }
}
