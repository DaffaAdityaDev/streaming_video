import { VideoPlayerMolecules } from "@/components/molecules/PlayerVideo"
import { VideoDataType } from "@/components/types";
import Link from 'next/link'

export default function VideoPlayerPage({params, searchParams }: { params: { slug: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
  return (
    <div className="col-span-9 flex flex-col gap-2">
      <VideoPlayerMolecules src={params.slug} quality={Array.isArray(searchParams.quality) ? searchParams.quality[0] : (searchParams.quality || 'defaultQuality')} />
      <h1 className="text-2xl">{params.slug}</h1>
      <div className="flex gap-4">
        <div className="avatar">
          <div className="w-16 rounded-full">
            <img src="https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif" />
          </div>
        </div>
        <div className="w-full flex justify-between">
          <div className="w-fit flex gap-4 text-white">
            <div>
              <p className="font-bold text-lg">{searchParams.quality}</p>
              <p>{searchParams.quality}</p>
            </div> 
            <button className="btn bg-white text-black hover:bg-rose-500 hover:text-white">
              Subscribe Lah
            </button>
          </div>
          <button className="btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-share-fill" viewBox="0 0 16 16">
              <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z"/>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>
  )
}