import React from 'react'

export default function CategorySkeleton() {
    const loop = Array.from({length: 7}, (_, index) => index);
  return (
    <div className="m-4 flex flex-row gap-4 justify-between overflow-hidden rounded-lg bg-slate-900 px-2 py-2 animate-pulse">
        {loop.map((item) => (
            <div
                className={`flex flex-col items-center justify-center rounded-lg bg-slate-800 py-2 px-12     `}
                
            >
            <div className='flex flex-row gap-2 h-14 w-14'></div>
             <div className='h-4 w-full bg-slate-700 rounded-full'></div>           
        </div>
        ))}
    </div>
  )
}
