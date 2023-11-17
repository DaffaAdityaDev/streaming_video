"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import MoleculesCardVideo from '@/components/molecules/CardVideo'
import VideoGridOrganism from '@/components/organism/VideoGrid'

import { VideoDataType } from '@/components/types'
import NavbarOrganism from '@/components/organism/Navbar'
import SideBarOrganism from '@/components/organism/SideBar'
import HomeTemplate from '@/components/template/Home'


export default function Home() {
  const [data, setData] = useState<VideoDataType[]>([
    {
      title: 'sukunavsjogo',
      channel: 'Description',
      img: 'https://picsum.photos/seed/picsum/200/300',
      slug: 'sukunavsjogo',
      quality: '1080p',
      duration: 100000,
      view: 100000,
      timeUpload: '1 day ago',
    },
    {
      title: 'flower',
      channel: 'Description',
      img: 'https://picsum.photos/seed/picsum/200/300',
      slug: 'flower',
      quality: 'defaultQuality',
      duration: 100000,
      view: 100000,
      timeUpload: '1 day ago',
    }, 
    {
      title: 'adaptivestreaming',
      channel: 'Description',
      img: 'https://picsum.photos/seed/picsum/200/300',
      slug: 'adaptivestreaming',
      quality: 'defaultQuality',
      duration: 100000,
      view: 100000,
      timeUpload: '1 day ago',
    }
  ]);

  useEffect(() => {
    let injectData = [];
    for (let i = 0; i < 10; i++) {
      injectData.push({
        title: 'sukunavsjogo',
        channel: 'Description',
        img: 'https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif',
        slug: 'sukunavsjogo',
        quality: '1080p',
        duration: 100000,
        view: 100000,
        timeUpload: '1 day ago',
      },
      {
        title: 'flower',
        channel: 'Description',
        img: 'https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif',
        slug: 'flower',
        quality: 'defaultQuality',
        duration: 100000,
        view: 100000,
        timeUpload: '1 day ago',
      }, 
      {
        title: 'adaptivestreaming',
        channel: 'Description',
        img: 'https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif',
        slug: 'adaptivestreaming',
        quality: 'defaultQuality',
        duration: 100000,
        view: 100000,
        timeUpload: '1 day ago',
      })
    }
    setData(injectData);

  }, []);


  return (
    <HomeTemplate>
      <NavbarOrganism />
      <SideBarOrganism />
      <VideoGridOrganism>
        {data.map((item, index) => (
          <MoleculesCardVideo key={index} {...item} />
        ))}
      </VideoGridOrganism>
    </HomeTemplate>
  )
}
