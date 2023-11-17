import Link from "next/link"
import { VideoDataType } from '../../types'

export default function MoleculesCardVideo({ img, title, channel: description, slug, quality, duration, view, timeUpload } : VideoDataType) {
  return (
    <div className="w-full h-full text-white rounded-md overflow-hidden shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 cursor-pointer">
      <Link href={`/video/${slug}?quality=${quality}`}>
        <div className="w-full">
          <img className="w-full h-full bg-center aspect-video object-cover" src={img} alt={title} />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
        <p>{quality}</p>
      </Link>
    </div>
  )
}