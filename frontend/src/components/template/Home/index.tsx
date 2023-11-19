import React from 'react'

export default function NavigationTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className='grid grid-flow-row auto-rows-max gap-4'>
      {children}
    </div>
  )
}
