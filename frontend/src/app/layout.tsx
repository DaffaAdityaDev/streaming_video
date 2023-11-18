"use client"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavigationTemplate from '@/components/template/Home'
import SideBarOrganism from '@/components/organism/SideBar'
import { SearchContext } from '@/components/organism/Navbar'
import NavbarOrganism from '@/components/organism/Navbar'
import { useState } from 'react'

const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Video Streaming',
//   description: 'NextGen Video Streaming',
// }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [search, setSearch] = useState('');

  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className={inter.className}>
        <SearchContext.Provider value={{ search, setSearch }} >
          <NavigationTemplate>
            <NavbarOrganism />
            <SideBarOrganism />
              {children}

          </NavigationTemplate>
        </SearchContext.Provider>
      </body>
    </html>
  )
}
