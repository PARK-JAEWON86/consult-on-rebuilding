import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token')
  const { pathname } = request.nextUrl

  // 보호된 경로들 (서버 사이드에서 인증 처리하는 경로는 제외)
  const protectedPaths = ['/dashboard', '/me', '/payments']
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))

  // 인증이 필요한 페이지에 접근할 때
  if (isProtectedPath && !accessToken) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
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
