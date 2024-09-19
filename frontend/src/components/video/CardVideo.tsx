import Link from 'next/link';
import { VideoDataType } from '@/app/types';
import Card from '@/components/common/Card';

export default function CardVideo({
  id_video,
  title_video,
  channel: description,
  slug,
  quality,
  thumbnail,
}: VideoDataType) {
  let imgHandler = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/thumbnail/${thumbnail}`;
  let urlHandler =
    `/video/watch?video=${slug}&quality=${quality}&id_video=${id_video}` || undefined;
  return (
    <Card
      variant="compact"
      url={urlHandler}
      img={imgHandler}
      title={title_video}
      description={description}
      quality={quality}
    />
    // <div className="h-full w-full transform cursor-pointer overflow-hidden rounded-md text-white shadow-md transition duration-300 ease-in-out hover:-translate-y-1 hover:scale-105 hover:shadow-lg">
    //   <Link href={`/video/watch?video=${slug}&quality=${quality}&id_video=${id_video}`}>
    //     <div className="w-full">
    //       <img
    //         className="aspect-video h-full w-full bg-center object-cover"
    //         src={imgHandler}
    //         alt={title_video}
    //       />
    //     </div>
    //     <h2>{title_video}</h2>
    //     <p>{description}</p>
    //     <p>{quality}</p>
    //   </Link>
    // </div>
  );
}
