/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { VideoDataType } from '@/app/types';

export default function CardVideo({
  id_video,
  title_video,
  channel: description,
  slug,
  quality,
}: VideoDataType) {
  let imgHandler = `${process.env.NEXT_PUBLIC_BACKEND_URL}/thumbnail/${slug}`;
  // console.log(id);
  return (
    <div className="h-full w-full transform cursor-pointer overflow-hidden rounded-md text-white shadow-md transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg">
      <Link href={`/video/watch?video=${slug}&quality=${quality}&id_video=${id_video}`}>
        <div className="w-full">
          <img
            className="aspect-video h-full w-full bg-center object-cover"
            src={imgHandler}
            alt={title_video}
          />
        </div>
        <h2>{title_video}</h2>
        <p>{description}</p>
        <p>{quality}</p>
      </Link>
    </div>
  );
}
