"use client"

import Image from 'next/image'
import Link from 'next/link'
import { SearchContext } from '@/components/organism/Navbar'
import { useState, useEffect, useContext } from 'react'
import MoleculesCardVideo from '@/components/molecules/CardVideo'
import VideoGridOrganism from '@/components/organism/VideoGrid'

import { VideoDataType } from '@/components/types'

import videoData from '@/data/videoData'

export default function Home() {
  const [data, setData] = useState<VideoDataType[]>(videoData);
  const [dataSearch, setDataSearch] = useState<VideoDataType[]>(data);
  const { search, setSearch } = useContext(SearchContext);
  
  useEffect(() => {
    let injectData: VideoDataType[] = [];
    for (let i = 0; i < 10; i++) {
      injectData.push(
        ...videoData
      )
    }
    setData(injectData);

  }, []);

  useEffect(() => {
    if (search) {
      setDataSearch(data.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())));
    } else {
      setDataSearch(data);
    }
  }, [data, search]);


  return (
    <>
      <VideoGridOrganism>
        {dataSearch.map((item, index) => (
          <MoleculesCardVideo key={index} {...item} />
        ))}
      </VideoGridOrganism>
    </>
  )
}
