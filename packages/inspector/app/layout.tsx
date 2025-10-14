import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CERT Inspector',
  description: 'LLM System Reliability Testing Inspector',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
