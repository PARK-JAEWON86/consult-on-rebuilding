import type { Metadata } from 'next'
import '../styles/globals.css'
import Providers from './providers'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'Consult On – 신뢰할 수 있는 전문가 상담',
  description: '세무·노무·법률 전문가와 신속하고 안전하게 상담하세요.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <ToastProvider>
          <Providers>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </Providers>
        </ToastProvider>
      </body>
    </html>
  )
}
