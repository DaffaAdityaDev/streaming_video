
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import NavigationTemplate from '@/components/template/Home'
import SideBarOrganism from '@/components/organism/SideBar'
import { AppContext } from '@/components/context'
import NavbarOrganism from '@/components/organism/Navbar'
// import { useState } from 'react'
import { SessionProvider, useSession } from 'next-auth/react'
import { Session } from 'next-auth'

const inter = Inter({ subsets: ['latin'] })

// export const metadata: Metadata = {
//   title: 'Video Streaming',
//   description: 'NextGen Video Streaming',
// }

export default function RootLayout({
  children,
  session,
}: {
  children: React.ReactNode
  session: Session | null
}) {
  // const [search, setSearch] = useState('')
  // const [sidebar, setSidebar] = useState(false)

  return (
    <html lang="en" className="dark overflow-x-hidden">
      <body className={inter.className}>
        {/* <SessionProvider session={session}> */}
        {/* <AppContext.Provider value={{ search, setSearch, sidebar, setSidebar }}> */}
          <NavigationTemplate>
            {/* <NavbarOrganism /> */}
            {/* <SideBarOrganism /> */}
            {children}
          </NavigationTemplate>
        {/* </AppContext.Provider> */}
        {/* </SessionProvider> */}
      </body>
    </html>
  )
}
