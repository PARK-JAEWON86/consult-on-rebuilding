import type { Metadata } from 'next'
import '../styles/globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'Consulton',
  description: 'Expert consultation platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
