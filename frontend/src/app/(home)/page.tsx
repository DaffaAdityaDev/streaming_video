'use client';
import { VideoDataType } from '@/app/types';
import { fetcher } from '@/utils/api';
import dynamic from 'next/dynamic';
import CategorySkeleton from '@/components/skeletons/CategorySkeleton';
import CardVideoSkeleton from '@/components/skeletons/CardVideoSkeleton';
import useSWR from 'swr';

const CardVideo = dynamic(() => import('@/components/video/CardVideo'), {
  loading: () => <CardVideoSkeleton />,
});

const Category = dynamic(() => import('@/components/navigation/Category'), {
  loading: () => <CategorySkeleton />,
});


export default function Home() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video`;
  const { data, error } = useSWR<{ status: string; data: VideoDataType[] }>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000, // Revalidate every 60 seconds
      errorRetryCount: 3,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Only retry up to 3 times
        if (retryCount >= 3) return;

        // Retry after 2 seconds
        setTimeout(() => revalidate({ retryCount }), 2000);
      },
    }
  );

  if (error) return <div>Failed to load videos</div>;
  if (!data) return (
    <div className="m-4">
      <CategorySkeleton />
      <div className="col-span-12 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
        {[...Array(6)].map((_, i) => <CardVideoSkeleton key={i} />)}
      </div>
    </div>
  );

  return (
    <div className="m-4">
      <Category />
      <div className="col-span-12 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
        {data.data.map((item) => (
          <CardVideo key={item.id_video} {...item} />
        ))}
      </div>
      {/* <HomeClientWrapper initialData={videos} /> */}
    </div>
  );
}