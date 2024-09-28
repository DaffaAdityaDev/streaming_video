import React from 'react';

export default function CategorySkeleton() {
  const loop = Array.from({ length: 7 }, (_, index) => index);
  return (
    <div className="m-4 flex animate-pulse flex-row justify-between gap-4 overflow-hidden rounded-lg bg-slate-900 px-2 py-2">
      {loop.map((item, index) => (
        <div
          className={`flex flex-col items-center justify-center rounded-lg bg-slate-800 px-12 py-2     `}
          key={index}
        >
          <div className="flex h-14 w-14 flex-row gap-2"></div>
          <div className="h-4 w-full rounded-full bg-slate-700"></div>
        </div>
      ))}
    </div>
  );
}
