import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic', 'latin'] })

export const metadata: Metadata = {
  title: 'لوحة تداولات المحل',
  description: 'لوحة تداولات ومخزون موبايل أولًا باستخدام Next.js و Tailwind و PocketBase',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>{children}</body>
    </html>
  )
}
