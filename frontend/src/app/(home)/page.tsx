'use client';
import { useState, useEffect, useContext } from 'react';
import useSWR from 'swr';
import { AppContext } from '@/components/context/AppContext';
import { VideoDataType } from '@/app/types';
import CardVideo from '@/components/video/CardVideo';
import { fetcher } from '@/utils/api';

export default function Home() {
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video`;
  const { search } = useContext(AppContext);
  const { data, error } = useSWR<{ status: string; data: VideoDataType[] }>(url, fetcher);

  const [filteredData, setFilteredData] = useState<VideoDataType[]>([]);

  useEffect(() => {
    if (data?.status === 'success') {
      if (search) {
        setFilteredData(
          data.data.filter((item) =>
            item.title_video.toLowerCase().includes(search.toLowerCase())
          )
        );
      } else {
        setFilteredData(data.data);
      }
    }
  }, [data, search]);

  if (error) return <div>Failed to load videos</div>;
  if (!data) return <div>Loading...</div>;

  return (
    <div className="col-span-12 m-4 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
      {filteredData.map((item) => (
        <CardVideo key={item.id_video} {...item} />
      ))}
    </div>
  );
}