import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RareSift App - AI-Powered AV Search',
  description: 'Search and analyze autonomous vehicle scenarios using advanced AI',
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}