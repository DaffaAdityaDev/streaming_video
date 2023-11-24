import { ReactNode } from 'react'

export default function VideoGridOrganism({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-12 m-4 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
      {children}
    </div>
  )
}
