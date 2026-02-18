import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { prisma } from '@flowchat/database'
import * as bcrypt from 'bcryptjs'
import * as crypto from 'crypto'
import { getPlan } from '../billing/plans'

export const ROLES = ['owner', 'admin', 'editor', 'agent', 'viewer'] as const
export type Role = (typeof ROLES)[number]

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 5,
  admin: 4,
  editor: 3,
  agent: 2,
  viewer: 1,
}

export interface TeamMember {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  avatarUrl: string | null
  isActive: boolean
  lastLoginAt: Date | null
  createdAt: Date
}

export interface PendingInvite {
  id: string
  email: string
  role: string
  invitedAt: Date
  expiresAt: Date
}

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name)

  async getMembers(tenantId: string): Promise<TeamMember[]> {
    const users = await prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ role: 'asc' }, { createdAt: 'asc' }],
    })

    return users
  }

  async getMember(tenantId: string, userId: string): Promise<TeamMember> {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    if (!user) throw new NotFoundException('Team member not found')
    return user
  }

  async inviteMember(
    tenantId: string,
    invitedBy: string,
    email: string,
    role: Role,
  ): Promise<{ inviteToken: string; expiresAt: Date }> {
    await this.checkSeatLimit(tenantId)
    await this.checkRolePermission(tenantId, invitedBy, role)

    const existing = await prisma.user.findFirst({
      where: { tenantId, email, deletedAt: null },
    })
    if (existing) {
      throw new BadRequestException('User with this email already exists in your team')
    }

    const inviteToken = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 86_400_000)

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    const invites = (settings.pendingInvites as Array<Record<string, unknown>>) ?? []

    invites.push({
      token: inviteToken,
      email,
      role,
      invitedBy,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    })

    settings.pendingInvites = invites

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: settings as object },
    })

    this.logger.log(`Invite sent to ${email} for tenant ${tenantId} with role ${role}`)

    return { inviteToken, expiresAt }
  }

  async acceptInvite(
    inviteToken: string,
    data: { firstName: string; lastName: string; password: string },
  ): Promise<{ userId: string; tenantId: string }> {
    const tenants = await prisma.tenant.findMany({
      select: { id: true, settings: true },
    })

    let foundTenantId: string | null = null
    let invite: Record<string, unknown> | null = null

    for (const tenant of tenants) {
      const settings = (tenant.settings as Record<string, unknown>) ?? {}
      const invites = (settings.pendingInvites as Array<Record<string, unknown>>) ?? []
      const match = invites.find((i) => i.token === inviteToken)
      if (match) {
        foundTenantId = tenant.id
        invite = match
        break
      }
    }

    if (!foundTenantId || !invite) {
      throw new BadRequestException('Invalid or expired invite token')
    }

    const expiresAt = new Date(invite.expiresAt as string)
    if (expiresAt < new Date()) {
      throw new BadRequestException('Invite has expired')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        tenantId: foundTenantId,
        email: invite.email as string,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: invite.role as string,
      },
    })

    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: foundTenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    const invites = (settings.pendingInvites as Array<Record<string, unknown>>) ?? []
    settings.pendingInvites = invites.filter((i) => i.token !== inviteToken)

    await prisma.tenant.update({
      where: { id: foundTenantId },
      data: { settings: settings as object },
    })

    return { userId: user.id, tenantId: foundTenantId }
  }

  async getPendingInvites(tenantId: string): Promise<PendingInvite[]> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    const invites = (settings.pendingInvites as Array<Record<string, unknown>>) ?? []

    return invites
      .filter((i) => new Date(i.expiresAt as string) > new Date())
      .map((i, index) => ({
        id: `invite_${index}`,
        email: i.email as string,
        role: i.role as string,
        invitedAt: new Date(i.createdAt as string),
        expiresAt: new Date(i.expiresAt as string),
      }))
  }

  async cancelInvite(tenantId: string, email: string): Promise<void> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { settings: true },
    })

    const settings = (tenant.settings as Record<string, unknown>) ?? {}
    const invites = (settings.pendingInvites as Array<Record<string, unknown>>) ?? []
    settings.pendingInvites = invites.filter((i) => i.email !== email)

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: settings as object },
    })
  }

  async updateRole(
    tenantId: string,
    updatedBy: string,
    userId: string,
    newRole: Role,
  ): Promise<void> {
    const target = await this.getMember(tenantId, userId)

    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot change the owner role')
    }

    await this.checkRolePermission(tenantId, updatedBy, target.role as Role)

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    this.logger.log(`User ${userId} role changed to ${newRole} by ${updatedBy}`)
  }

  async removeMember(
    tenantId: string,
    removedBy: string,
    userId: string,
  ): Promise<void> {
    const target = await this.getMember(tenantId, userId)

    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot remove the owner')
    }

    if (userId === removedBy) {
      throw new BadRequestException('Cannot remove yourself')
    }

    await this.checkRolePermission(tenantId, removedBy, target.role as Role)

    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date(), isActive: false },
    })

    await prisma.conversation.updateMany({
      where: { assignedAgentId: userId, tenantId },
      data: { assignedAgentId: null },
    })

    this.logger.log(`User ${userId} removed from tenant ${tenantId} by ${removedBy}`)
  }

  async toggleActive(
    tenantId: string,
    updatedBy: string,
    userId: string,
  ): Promise<{ isActive: boolean }> {
    const target = await this.getMember(tenantId, userId)

    if (target.role === 'owner') {
      throw new ForbiddenException('Cannot deactivate the owner')
    }

    await this.checkRolePermission(tenantId, updatedBy, target.role as Role)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !target.isActive },
      select: { isActive: true },
    })

    return { isActive: updated.isActive }
  }

  private async checkSeatLimit(tenantId: string): Promise<void> {
    const tenant = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { plan: true },
    })

    const plan = getPlan(tenant.plan)
    const memberCount = await prisma.user.count({
      where: { tenantId, deletedAt: null },
    })

    if (plan.limits.teamMembers !== -1 && memberCount >= plan.limits.teamMembers) {
      throw new BadRequestException(
        `Team member limit reached (${plan.limits.teamMembers} on ${plan.name} plan). Upgrade to add more members.`,
      )
    }
  }

  private async checkRolePermission(
    tenantId: string,
    actorId: string,
    targetRole: Role,
  ): Promise<void> {
    const actor = await prisma.user.findFirst({
      where: { id: actorId, tenantId, deletedAt: null },
      select: { role: true },
    })

    if (!actor) throw new ForbiddenException('Not a member of this team')

    const actorLevel = ROLE_HIERARCHY[actor.role as Role] ?? 0
    const targetLevel = ROLE_HIERARCHY[targetRole] ?? 0

    if (actorLevel <= targetLevel && actor.role !== 'owner') {
      throw new ForbiddenException('Insufficient permissions for this action')
    }
  }
}
