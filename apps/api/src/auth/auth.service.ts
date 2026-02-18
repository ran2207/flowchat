import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { prisma } from '@flowchat/database'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async register(dto: RegisterDto) {
    const existingUser = await prisma.user.findFirst({
      where: { email: dto.email },
    })

    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    const slug = dto.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const existingTenant = await prisma.tenant.findUnique({ where: { slug } })
    const finalSlug = existingTenant ? `${slug}-${Date.now().toString(36)}` : slug

    const passwordHash = await bcrypt.hash(dto.password, 12)

    const tenant = await prisma.tenant.create({
      data: {
        name: dto.businessName,
        slug: finalSlug,
        plan: 'free',
        users: {
          create: {
            email: dto.email,
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            role: 'owner',
          },
        },
      },
      include: { users: true },
    })

    const user = tenant.users[0]
    const token = this.generateToken(user.id, tenant.id, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
      },
    }
  }

  async login(dto: LoginDto) {
    const user = await prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: { tenant: true },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash)

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = this.generateToken(user.id, user.tenantId, user.role)

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      },
    }
  }

  private generateToken(userId: string, tenantId: string, role: string): string {
    return this.jwtService.sign({
      sub: userId,
      tenantId,
      role,
    })
  }
}
