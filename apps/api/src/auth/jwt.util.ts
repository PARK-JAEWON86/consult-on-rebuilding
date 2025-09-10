import { JwtService } from '@nestjs/jwt'
import { randomUUID } from 'crypto'

export function signAccess(
  jwt: JwtService,
  user: { id: number; email: string },
  secret: string,
  ttlSec: number
) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    { secret, expiresIn: ttlSec }
  )
}

export function signRefresh(
  jwt: JwtService,
  user: { id: number; email: string },
  secret: string,
  ttlSec: number
) {
  // jti는 후속(레디스 화이트리스트)에서 사용 예정
  return jwt.sign(
    { sub: user.id, email: user.email, jti: randomUUID() },
    { secret, expiresIn: ttlSec }
  )
}
