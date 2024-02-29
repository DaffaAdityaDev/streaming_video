'use client'
import { AppContext } from '@/app/_components/context/AppContext'
import { useState, useEffect, useContext } from 'react'

import { VideoDataType } from '@/app/types'

import videoData from '@/data/videoData'
import CardVideo from '../_components/video/CardVideo'

import axios from 'axios'

export default function Home() {
  // const [data, setData] = useState<VideoDataType[]>(videoData)
  const [data, setData] = useState<VideoDataType[]>([])
  const [dataSearch, setDataSearch] = useState<VideoDataType[]>(data)
  const { search, setSearch } = useContext(AppContext)

  function getDataFromAPI(path: string) {
    return axios.get(path).then((response) => {
      return response.data;
    });
}

useEffect(() => {
  const fetchData = async () => {
      const data = await getDataFromAPI(`${process.env.NEXT_PUBLIC_BACKEND_URL}/videos`);
      setData(data);
  };

  fetchData();
}, []);

  useEffect(() => {
    if (search) {
      setDataSearch(data.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())))
    } else {
      setDataSearch(data)
    }
  }, [data, search])

  console.log(data)

  return (
    <>
      <div className="col-span-12 m-4 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4 ">
        {dataSearch.map((item, index) => (
          <CardVideo key={index} {...item} />
        ))}
      </div>
    </>
  )
}
