import { ReactNode } from "react";

export default function VideoGridOrganism({ children } : { children: ReactNode }) {
    return (
        <div className='grid col-span-11 col-start- grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4 m-4'>
            {children}
        </div>
    );
}