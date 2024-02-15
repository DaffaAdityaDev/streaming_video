"use client"

import { Inter } from 'next/font/google'

import '@/app/globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <html lang="en" className="dark bg-primary-content overflow-x-hidden">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
