"use client"

import { Inter } from 'next/font/google'
import { useState } from 'react'
import { AppContext } from '@/app/_components/context/AppContext'
import SideBar from '@/app/_components/navigation/SideBar'
import Navbar from '@/app/_components/navigation/Navbar'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [search, setSearch] = useState('')
  const [sidebar, setSidebar] = useState(false)

  return (
    <AppContext.Provider value={{ search, setSearch, sidebar, setSidebar }}>
      <div className="grid grid-flow-row auto-rows-max gap-4">
        <Navbar />
        <SideBar />
        {children}

      </div>
    </AppContext.Provider>
  )
}
