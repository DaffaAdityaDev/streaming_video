/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { VideoDataType } from '@/app/types'

export default function CardVideo({
  id,
  img,
  title,
  channel: description,
  slug,
  quality,
  duration,
  view,
  timeUpload,
}: VideoDataType) {
  return (
    <div className="h-full w-full transform cursor-pointer overflow-hidden rounded-md text-white shadow-md transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg">
      <Link href={`/video/watch?video=${slug}&quality=${quality}`}>
        <div className="w-full">
          <img
            className="aspect-video h-full w-full bg-center object-cover"
            src={img}
            alt={title}
          />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        <p>{quality}</p>
      </Link>
    </div>
  )
}
