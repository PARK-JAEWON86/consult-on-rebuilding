import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')
  const { pathname } = request.nextUrl

  // 보호된 경로들 (서버 사이드에서 인증 처리하는 경로는 제외)
  const protectedPaths = ['/dashboard', '/me', '/payments', '/admin', '/chat']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // 공개 경로들 (인증 없이 접근 가능)
  const publicPaths = [
    '/', // 랜딩 페이지
    '/auth',
    '/experts',
    '/community',
    '/terms',
    '/privacy',
    '/health',
  ]
  const isPublicPath = publicPaths.some(path =>
    pathname === path || (path !== '/' && pathname.startsWith(path))
  )

  // 인증이 필요한 페이지에 미인증 사용자가 접근할 때 → 랜딩 페이지로 리다이렉트
  if (isProtectedPath && !accessToken) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 이미 로그인된 사용자가 로그인/회원가입 페이지에 접근할 때
  const authPaths = ['/auth/login', '/auth/register']
  const isAuthPath = authPaths.some(path => pathname.startsWith(path))

  if (isAuthPath && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
