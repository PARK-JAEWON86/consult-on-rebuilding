import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to Consulton
        </h1>
        <p className="text-lg text-center text-gray-600 max-w-2xl mb-8">
          Expert consultation platform built with Next.js 14 App Router and NestJS
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link 
            href="/experts" 
            className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition-colors"
          >
            전문가 보기
          </Link>
          <Link 
            href="/me/reservations" 
            className="rounded-xl border border-blue-600 px-6 py-3 text-blue-600 hover:bg-blue-50 transition-colors"
          >
            내 예약
          </Link>
          <Link 
            href="/credits" 
            className="rounded-xl border border-green-600 px-6 py-3 text-green-600 hover:bg-green-50 transition-colors"
          >
            크레딧 충전
          </Link>
          <Link 
            href="/sessions/dev" 
            className="rounded-xl border border-purple-600 px-6 py-3 text-purple-600 hover:bg-purple-50 transition-colors"
          >
            세션 개발
          </Link>
        </div>
      </div>
    </main>
  )
}
