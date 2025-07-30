import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import DebugToggle from '@/components/debug/debug-toggle'

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
        <Providers>
          {children}
          <DebugToggle />
        </Providers>
      </body>
    </html>
  )
} 