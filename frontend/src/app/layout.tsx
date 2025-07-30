import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import DebugToggle from '@/components/debug/debug-toggle'
import { ErrorBoundary } from '@/components/error-boundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RareSift - AI-Powered AV Search',
  description: 'Search and analyze autonomous vehicle scenarios using advanced AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <Providers>
            {children}
            <DebugToggle />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
} 