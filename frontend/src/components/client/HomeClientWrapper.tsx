'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { VideoDataType } from '@/app/types';

const CardVideo = dynamic(() => import('@/components/video/CardVideo'), {
  loading: () => <p>Loading...</p>,
});

export default function HomeClient({
  initialData,
  search,
}: {
  initialData: VideoDataType[];
  search: string;
}) {
  const [filteredData, setFilteredData] = useState<VideoDataType[]>(initialData);

  useEffect(() => {
    if (search) {
      setFilteredData(
        initialData.filter((item) => item.title_video.toLowerCase().includes(search.toLowerCase())),
      );
    } else {
      setFilteredData(initialData);
    }
  }, [initialData, search]);

  return (
    <div className="col-span-12 m-4 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
      {filteredData.map((item) => (
        <CardVideo key={item.id_video} {...item} />
      ))}
    </div>
  );
}
