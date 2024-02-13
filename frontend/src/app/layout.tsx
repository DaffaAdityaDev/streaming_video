
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { useState } from 'react'
import { AppContext } from '@/app/_components/context/AppContext'
import { Session } from 'next-auth'
import SideBar from '@/app/_components/navigation/SideBar'
import Navbar from './_components/navigation/Navbar'

import './globals.css'

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
  // const [search, setSearch] = useState('')
  // const [sidebar, setSidebar] = useState(false)

  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className={inter.className}>
        {/* <SessionProvider session={session}> */}
        <AppContext.Provider value={{ search, setSearch, sidebar, setSidebar }}>
          <div className="grid grid-flow-row auto-rows-max gap-4">
            <Navbar />
            <SideBar />
            {children}

          </div>
        </AppContext.Provider>
        {/* </SessionProvider> */}
      </body>
    </html>
  )
}
