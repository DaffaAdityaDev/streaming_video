import React from 'react'

export default function NavigationTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className='grid grid-cols-12 grid-rows-12 gap-4 h-screen'>
      {children}
    </div>
  )
}
