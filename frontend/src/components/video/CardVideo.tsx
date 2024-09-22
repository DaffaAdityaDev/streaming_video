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
  );
}
