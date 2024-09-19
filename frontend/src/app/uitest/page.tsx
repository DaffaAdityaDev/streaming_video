'use client'
import VideoDashboard from '@/components/dashboard/VideoDashboard';
import { VideoDataType } from '@/app/types';
import { useState, useEffect } from 'react';

function generateFakeData(count: number): VideoDataType[] {
  return Array.from({ length: count }, (_, i) => ({
    id_video: i + 1,
    title_video: `Video ${i + 1}`,
    description: `Description for Video ${i + 1}`,
    channel: `Channel ${i + 1}`,
    thumbnail: `thumbnail_${i + 1}.jpg`,
    slug: `video-${i + 1}`,
    quality: ['480p', '720p', '1080p'][Math.floor(Math.random() * 3)],
    views: Math.floor(Math.random() * 1000000),
    likes: Math.floor(Math.random() * 100000),
    created_at: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    id_user: Math.floor(Math.random() * 1000)
  }));
}

function Page() {
  const [email, setEmail] = useState<string | null>(null);
  const latestUploads: VideoDataType[] = generateFakeData(5);
  const latestComments: VideoDataType[] = generateFakeData(5);

  useEffect(() => {
    setEmail(localStorage.getItem('email'));
  }, []);

  if (!email) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto">
      <VideoDashboard 
        latestUploads={latestUploads} 
        latestComments={latestComments} 
        email={email} 
      />
    </div>
  );
}

export default Page;