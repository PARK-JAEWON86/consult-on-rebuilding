import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
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
        error: { code: 'E_AUTH_NO_TOKEN', message: 'No access token provided' },
      })
    }

    try {
      // Step 1: Verify token
      const payload = this.auth.verifyToken(
        accessToken,
        process.env.JWT_ACCESS_SECRET!
      )

      // Step 2: Fetch full user info from database to include roles
      const user = await this.auth.getUserById(payload.sub)
      if (!user) {
        console.error('[JwtGuard] User not found:', { userId: payload.sub })
        throw new UnauthorizedException({
          success: false,
          error: { code: 'E_USER_NOT_FOUND', message: 'User not found' },
        })
      }

      // Add complete user info to request object
      // userId 필드를 추가하여 Controller 호환성 유지
      const userWithId = {
        ...user,
        userId: user.id,  // id를 userId로도 제공
      }
      console.log('[JwtGuard] Setting req.user:', { id: userWithId.id, userId: userWithId.userId, email: userWithId.email })
      ;(request as any).user = userWithId
      return true
    } catch (error: any) {
      // Log error details for debugging
      console.error('[JwtGuard] Authentication error:', {
        message: error?.message || 'Unknown error',
        name: error?.name,
        code: error?.code,
        // Don't log the full stack in production, but useful for debugging
        ...(process.env.NODE_ENV === 'development' && { stack: error?.stack })
      })

      // If it's already an UnauthorizedException, re-throw it
      if (error instanceof UnauthorizedException) {
        throw error
      }

      // For JWT specific errors, provide more context
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'E_AUTH_TOKEN_EXPIRED',
            message: 'Access token has expired',
          },
        })
      }

      if (error?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException({
          success: false,
          error: {
            code: 'E_AUTH_INVALID_TOKEN',
            message: 'Invalid access token',
          },
        })
      }

      // For any other errors (DB errors, parsing errors, etc.)
      throw new UnauthorizedException({
        success: false,
        error: {
          code: 'E_AUTH_FAILED',
          message: 'Authentication failed',
        },
      })
    }
  }
}
