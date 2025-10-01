import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PrismaService } from '../../prisma/prisma.service'

export enum AdminPermission {
  MANAGE_APPLICATIONS = 'manage_applications',
  MANAGE_USERS = 'manage_users',
  MANAGE_EXPERTS = 'manage_experts',
  MANAGE_CONTENT = 'manage_content',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SETTINGS = 'manage_settings',
}

/**
 * AdminRoleGuard - 세분화된 관리자 권한 체크
 * AdminUser 테이블에서 role과 permissions를 확인
 */
@Injectable()
export class AdminRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<AdminPermission>(
      'adminPermission',
      context.getHandler()
    )

    if (!requiredPermission) {
      return true // 권한이 지정되지 않았으면 통과
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'E_UNAUTHORIZED', message: 'Authentication required' }
      })
    }

    // AdminUser 정보 조회
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { userId: user.id }
    })

    if (!adminUser) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'E_NOT_ADMIN', message: 'Not an admin user' }
      })
    }

    // SUPER_ADMIN은 모든 권한 보유
    if (adminUser.role === 'SUPER_ADMIN') {
      return true
    }

    // Role별 기본 권한
    const rolePermissions: Record<string, AdminPermission[]> = {
      ADMIN: [
        AdminPermission.MANAGE_APPLICATIONS,
        AdminPermission.MANAGE_USERS,
        AdminPermission.MANAGE_EXPERTS,
        AdminPermission.VIEW_ANALYTICS,
      ],
      MODERATOR: [
        AdminPermission.MANAGE_CONTENT,
        AdminPermission.VIEW_ANALYTICS,
      ],
      ANALYST: [
        AdminPermission.VIEW_ANALYTICS,
      ],
    }

    const defaultPermissions = rolePermissions[adminUser.role] || []

    // 커스텀 permissions가 있으면 추가
    const customPermissions = adminUser.permissions
      ? (typeof adminUser.permissions === 'string'
          ? JSON.parse(adminUser.permissions)
          : adminUser.permissions)
      : []

    const allPermissions = [...defaultPermissions, ...customPermissions]

    if (!allPermissions.includes(requiredPermission)) {
      throw new ForbiddenException({
        success: false,
        error: {
          code: 'E_INSUFFICIENT_PERMISSION',
          message: 'Insufficient permission for this action'
        }
      })
    }

    return true
  }
}
