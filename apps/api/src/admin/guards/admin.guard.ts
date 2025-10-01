import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

/**
 * AdminGuard - 관리자 권한 확인 가드
 * User의 roles에 'ADMIN'이 포함되어 있는지 확인
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'E_UNAUTHORIZED', message: 'Authentication required' }
      })
    }

    // User roles 확인
    const roles = Array.isArray(user.roles) ? user.roles :
                  typeof user.roles === 'string' ? JSON.parse(user.roles) : []

    if (!roles.includes('ADMIN')) {
      throw new ForbiddenException({
        success: false,
        error: { code: 'E_ADMIN_REQUIRED', message: 'Admin access required' }
      })
    }

    return true
  }
}
