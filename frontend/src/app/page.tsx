'use client'
import { AppContext } from '@/app/_components/context/AppContext'
import { useState, useEffect, useContext } from 'react'

import { VideoDataType } from '@/app/types'

import videoData from '@/data/videoData'
import CardVideo from './_components/video/CardVideo'

export default function Home() {
  const [data, setData] = useState<VideoDataType[]>(videoData)
  const [dataSearch, setDataSearch] = useState<VideoDataType[]>(data)
  const { search, setSearch } = useContext(AppContext)

  // useEffect(() => {
  //   let injectData: VideoDataType[] = []
  //   for (let i = 0; i < 10; i++) {
  //     injectData.push(...videoData)
  //   }
  //   setData(injectData)
  // }, [])

  useEffect(() => {
    if (search) {
      setDataSearch(data.filter((item) => item.title.toLowerCase().includes(search.toLowerCase())))
    } else {
      setDataSearch(data)
    }
  }, [data, search])

  return (
    <>
    <div className="col-span-12 m-4 grid grid-cols-[repeat(auto-fill,minmax(calc(400px),1fr))] gap-4">
      {dataSearch.map((item, index) => (
        <CardVideo key={index} {...item} />
      ))}
    </div>

    </>
  )
}
