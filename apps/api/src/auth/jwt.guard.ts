import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { Request } from 'express'
import { AuthService } from './auth.service'

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>()

    const accessToken = request.cookies?.access_token
    if (!accessToken) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_NO_TOKEN', message: 'No access token provided' }
      })
    }

    try {
      const payload = this.auth.verifyToken(accessToken, process.env.JWT_ACCESS_SECRET!)

      // Fetch full user info from database to include roles
      const user = await this.auth.getUserById(payload.sub)
      if (!user) {
        throw new UnauthorizedException({
          success: false,
          error: { code: 'E_USER_NOT_FOUND', message: 'User not found' }
        })
      }

      // Add complete user info to request object
      ;(request as any).user = user
      return true
    } catch (error) {
      throw new UnauthorizedException({
        success: false,
        error: { code: 'E_AUTH_INVALID_TOKEN', message: 'Invalid or expired access token' }
      })
    }
  }
}
