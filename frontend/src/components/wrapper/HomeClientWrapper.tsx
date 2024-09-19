'use client';
import { useState, useEffect, useContext } from 'react';
import dynamic from 'next/dynamic';
import { VideoDataType } from '@/app/types';
import { AppContext } from '@/components/context/AppContext';
import CardVideoSkeleton from '@/components/skeletons/CardVideoSkeleton';

const CardVideo = dynamic(() => import('@/components/video/CardVideo'), {
  loading: () => <CardVideoSkeleton />,
});

export default function HomeClientWrapper({
  initialData,
}: {
  initialData: VideoDataType[];
}) {
  const { search } = useContext(AppContext);
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

  if (filteredData.length === 0) {
    return <div>No videos available. Check back later!</div>;
  }

  return (
    <div className="col-span-12 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
      {filteredData?.map((item) => (
        <CardVideo key={item.id_video} {...item} />
      ))}
    </div>
  );
}