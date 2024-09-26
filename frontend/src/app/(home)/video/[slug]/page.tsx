'use client';
import { AppContext } from '@/components/context/AppContext';
/* eslint-disable @next/next/no-img-element */
import dynamic from 'next/dynamic';
import { VideoDataType } from '@/app/types';
// import videoData from '@/data/videoData';
import { useState, useEffect, useContext } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/utils/api';
import { PlayerVideo } from '@/components/video/PlayerVideo';
import axios from 'axios';

const CardVideo = dynamic(() => import('@/components/video/CardVideo'), {
  loading: () => <p>Loading related video...</p>,
});

const CommentsList = dynamic(() => import('@/components/comments/commentsList'), {
  loading: () => <p>Loading comments...</p>,
});

const CommentVideo = dynamic(() => import('@/components/comments/commentVideo'), {
  loading: () => <p>Loading comment form...</p>,
});

export default function VideoPlayer({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { isFullScreen } = useContext(AppContext);
  const videoId = searchParams.id_video?.toString() || '';
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
  const [viewCounted, setViewCounted] = useState(false);

  const { data: videoData, error: videoError } = useSWR<{ status: string; data: VideoDataType[] }>(
    `${url}/video`,
    fetcher,
  );

  const { data: currentVideoData, error: currentVideoError } = useSWR<{ status: string; data: VideoDataType }>(
    `${url}/video/${searchParams.video}`,
    fetcher,
  );

  console.log('currentVideoData', currentVideoData);

  const { data: commentsData, error: commentsError } = useSWR<{ status: string; data: any[] }>(
    videoId ? `${url}/comment/${videoId}` : null,
    fetcher,
  );

  const incrementViewCount = async () => {
    if (!viewCounted) {
      try {
        const videoSlug = Array.isArray(searchParams.video) ? searchParams.video[0] : searchParams.video;
        if (videoSlug) {
          const urlViewIncrement = `${url}/video/${videoSlug}/view`;
          console.log('Incrementing view count:', urlViewIncrement);
          const token = localStorage.getItem('token'); // Assuming you store the token in localStorage
          await axios.post(urlViewIncrement, {}, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setViewCounted(true);
        } else {
          console.error('Video slug is undefined');
        }
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    }
  };

  if (videoError || commentsError) return <div>Failed to load data</div>;
  if (!videoData || !commentsData) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-12">
      <div className={`${isFullScreen ? 'col-span-12' : 'col-span-9'}`}>
        <PlayerVideo
          //  src={videoData.data[0].slug}
          //  quality={searchParams.quality?.toString() || 'defaultQuality'}
          src={
            Array.isArray(searchParams.video)
              ? searchParams.video[0]
              : searchParams.video || 'defaultQuality'
          }
          quality={
            Array.isArray(searchParams.quality)
              ? searchParams.quality[0]
              : searchParams.quality || 'defaultQuality'
          }
          onPlayVideoIncrementView={incrementViewCount}
        />
        <div className="px-10">
          <p className="text-2xl">{currentVideoData?.data.title_video}</p>
          <div className="flex gap-4">
            <div className="avatar">
              <div className="w-16 rounded-full">
                <img
                  src="https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0="
                  alt="foto"
                />
              </div>
            </div>
            <div className="flex w-full justify-between">
              <div className="flex w-fit gap-4 text-white">
                <div>
                  <p className="text-lg font-bold">{currentVideoData?.data.user?.username}</p>
                  <p>{searchParams.quality}</p>
                </div>
        
              </div>
              <button className="btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  className="bi bi-share-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z" />
                </svg>
                Share
              </button>
            </div>

          </div>
          <div className=''>
            <p>
              {currentVideoData?.data.description}
            </p>
          </div>
        </div>
        <div className="mx-10 flex flex-col gap-2">
          {/* <CommentVideo
            id_video={searchParams.id_video ? searchParams.id_video.toString() : ''}
            setComments={setComments}
          />
          <CommentsList comments={comments} />
           */}
          <CommentVideo
            id_video={videoId}
            setComments={() => {}} // This will be handled by SWR revalidation
          />
          <CommentsList comments={commentsData.data} />
        </div>
      </div>
      <div className="col-span-3 m-4 grid ">
        {/* {data?.map((item, index) => <CardVideo key={index} {...item} />)} */}
        {videoData.data?.map((item) => <CardVideo key={item.id_video} {...item} />)}
      </div>
    </div>
  );
}
