'use client';
import { AppContext } from '@/components/context/AppContext';
import { useState, useEffect, useContext } from 'react';

import { VideoDataType } from '@/app/types';

// import videoData from '@/data/videoData';
import CardVideo from '@/components/video/CardVideo';

import axios from 'axios';

export default function Home() {
  // const [data, setData] = useState<VideoDataType[]>(videoData)
  const [data, setData] = useState<VideoDataType[]>([]);
  const [dataSearch, setDataSearch] = useState<VideoDataType[]>(data);
  const { search, setSearch } = useContext(AppContext);

  function getDataFromAPI(path: string) {
    return axios.get(path).then((response) => {
      return response.data;
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      const response = await getDataFromAPI(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video`);
      if (response.status === 'success') {
        setData(response.data);
        setDataSearch(response.data);
      } else {
        console.error('Failed to fetch videos:', response.message);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    if (search) {
      setDataSearch(
        data.filter((item) => item.title_video.toLowerCase().includes(search.toLowerCase())),
      );
    } else {
      setDataSearch(data);
    }
  }, [data, search]);

  // console.log(data);

  return (
    <>
      <div className="col-span-12 m-4 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4 ">
        {dataSearch.map((item, index) => (
          <CardVideo key={index} {...item} />
        ))}
      </div>
    </>
  );
}
