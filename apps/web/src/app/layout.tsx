import type { Metadata } from 'next'
import '../styles/globals.css'
import Providers from './providers'
import Navbar from '@/components/layout/Navbar'
import { ToastProvider } from '@/components/ui/Toast'
import { getCurrentUser } from '@/lib/auth-server'
import ConditionalFooter from '@/components/layout/ConditionalFooter'

export const metadata: Metadata = {
  title: 'Consult On – 신뢰할 수 있는 전문가 상담',
  description: '세무·노무·법률 전문가와 신속하고 안전하게 상담하세요.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const initialUser = await getCurrentUser()

  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <ToastProvider>
          <Providers initialUser={initialUser}>
            <div className="flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <ConditionalFooter />
            </div>
          </Providers>
        </ToastProvider>
      </body>
    </html>
  )
}
