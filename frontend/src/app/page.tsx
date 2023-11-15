"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import CardVideo from '../components/molecules/CardVideo/page'
import HomeTemplate from '../components/template/Home/page'

type DataType = {
  title: string;
  description: string;
  img: string;
  slug: string;
  quality: string;
};

export default function Home() {
  const [data, setData] = useState<DataType[]>([
    {
      title: 'sukunavsjogo',
      description: 'Description',
      img: 'https://picsum.photos/seed/picsum/200/300',
      slug: 'sukunavsjogo',
      quality: '1080p',
    },
    {
      title: 'flower',
      description: 'Description',
      img: 'https://picsum.photos/seed/picsum/200/300',
      slug: 'flower',
      quality: 'defaultQuality',
    }, 
    {
      title: 'adaptivestreaming',
      description: 'Description',
      img: 'https://picsum.photos/seed/picsum/200/300',
      slug: 'adaptivestreaming',
      quality: 'defaultQuality',
    }
  ]);


  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4'>
      <HomeTemplate leftChild={<h1>Left child</h1>} rightChild={<h1>Right child</h1>} />
      {data.map((item, index) => (
        <CardVideo key={index} {...item} />
      ))}
    </div>
  )
}
