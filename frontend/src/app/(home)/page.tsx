// 'use client';
// import useSWR from 'swr';
// import dynamic from 'next/dynamic';
// import { useState, useEffect, useContext } from 'react';
// import { AppContext } from '@/components/context/AppContext';
// import { VideoDataType } from '@/app/types';
// import { fetcher } from '@/utils/api';
// import CardVideoSkeleton from '@/components/skeletons/CardVideoSkeleton';
// import CategorySkeleton from '@/components/skeletons/CategorySkeleton';
// // import Category from '@/components/navigation/Category';

// const CardVideo = dynamic(() => import('@/components/video/CardVideo'), {
//   loading: () => <CardVideoSkeleton />,
// });

// const Category = dynamic(() => import('@/components/navigation/Category'), {
//   loading: () => <CategorySkeleton />,
// });

// export default function Home() {
//   const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video`;
//   const { search } = useContext(AppContext);
//   const { data, error } = useSWR<{ status: string; data: VideoDataType[] }>(url, fetcher);

//   const [filteredData, setFilteredData] = useState<VideoDataType[]>([]);

//   useEffect(() => {
//     if (data?.status === 'success') {
//       if (search) {
//         setFilteredData(
//           data.data.filter((item) => item.title_video.toLowerCase().includes(search.toLowerCase())),
//         );
//       } else {
//         setFilteredData(data.data);
//       }
//     }
//   }, [data, search]);

//   if (error) return <div>Failed to load videos</div>;
//   if (!data)
//     return (
//       <div className="m-4">
//         <CategorySkeleton />
//         <div className="col-span-12 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
//             <CardVideoSkeleton />
//             <CardVideoSkeleton />
//             <CardVideoSkeleton />
//             <CardVideoSkeleton />
//             <CardVideoSkeleton />
//             <CardVideoSkeleton />
//         </div>
//       </div>
//     );

//   return (
//     <div className="m-4">
//       <Category />
//       <div className="col-span-12 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
//         {filteredData.map((item) => (
//           <CardVideo key={item.id_video} {...item} />
//         ))}
//       </div>
//     </div>
//   );
// }

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

// const HomeClientWrapper = dynamic(() => import('@/components/wrapper/HomeClientWrapper'), {
//   loading: () => <CardVideoSkeleton />,
// });

// export const revalidate = 60; // Revalidate every 60 seconds

// async function getVideos(retries = 3) {
//   const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video`;
//   console.log('Attempting to fetch videos from:', url);
//   try {
//     const res = await fetch(url, { next: { revalidate: 10 } });
//     if (!res.ok) {
//       throw new Error(`Failed to fetch videos: ${res.status} ${res.statusText}`);
//     }
//     const data = await res.json();
//     console.log('Fetched videos successfully');
//     return data;
//   } catch (error) {
//     console.error('Error fetching videos:', error);
//     if (retries > 0) {
//       console.log(`Retrying... (${retries} attempts left)`);
//       await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
//       return getVideos(retries - 1);
//     }
//     return { data: [] };
//   }
// }


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