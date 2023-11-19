"use client"
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavigationTemplate from '@/components/template/Home'
import SideBarOrganism from '@/components/organism/SideBar'
import { AppContext } from '@/components/context'
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
  const [sidebar, setSidebar] = useState(false);

  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className={inter.className}>
        <AppContext.Provider value={{ search, setSearch, sidebar, setSidebar}}>
          <NavigationTemplate>
            <NavbarOrganism />
            <SideBarOrganism />
              {children}

          </NavigationTemplate>
        </AppContext.Provider>
      </body>
    </html>
  )
}
