'use client';
import { AppContext } from '@/app/_components/context/AppContext';
/* eslint-disable @next/next/no-img-element */
import CardVideo from '@/app/_components/video/CardVideo';
import { PlayerVideo } from '@/app/_components/video/PlayerVideo';
import { VideoDataType } from '@/app/types';
// import videoData from '@/data/videoData';
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import CommentsList from '@/app/_components/comments/commentsList';
import CommentVideo from '@/app/_components/comments/commentVideo';

export default function VideoPlayer({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const [data, setData] = useState<VideoDataType[]>([]);
  const [comments, setComments] = useState([]);
  const { isFullScreen, setIsFullScreen } = useContext(AppContext);
  const [currentPath, setCurrentPath] = useState('');
  // console.log(searchParams)
  // console.log(params)

  // console.log(data)
  // console.log(comments)
  function getCommentsFromAPI(path: string) {
    return axios.get(path).then((response) => {
      return response.data;
    });
  }

  function getDataFromAPI(path: string) {
    return axios.get(path).then((response) => {
      return response.data;
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      const comments = await getCommentsFromAPI(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/${searchParams.id_video}`,
      );
      // console.log(comments.data);
      setComments(comments.data);
    };

    fetchData();
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getDataFromAPI(`${process.env.NEXT_PUBLIC_BACKEND_URL}/videos`);

      // console.log(data);
      setData(data);
    };

    fetchData();
  }, [searchParams]);

  return (
    <div className="grid grid-cols-12">
      <div className={`${isFullScreen ? 'col-span-12' : 'col-span-9'}`}>
        <PlayerVideo
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
          // searchParams={searchParams}
        />
        <div className="px-10">
          <h1 className="text-2xl">{params.slug}</h1>
          <div className="flex gap-4">
            <div className="avatar">
              <div className="w-16 rounded-full">
                <img src="https://media.istockphoto.com/id/1495088043/vector/user-profile-icon-avatar-or-person-icon-profile-picture-portrait-symbol-default-portrait.jpg?s=612x612&w=0&k=20&c=dhV2p1JwmloBTOaGAtaA3AW1KSnjsdMt7-U_3EZElZ0=" alt="foto" />
              </div>
            </div>
            <div className="flex w-full justify-between">
              <div className="flex w-fit gap-4 text-white">
                <div>
                  <p className="text-lg font-bold">{searchParams.quality}</p>
                  <p>{searchParams.quality}</p>
                </div>
                <button className="btn bg-white text-black hover:bg-rose-500 hover:text-white">
                  Subscribe Lah
                </button>
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
        </div>
        <div className="mx-10 flex flex-col gap-2">
          <CommentVideo
            id_video={searchParams.id_video ? searchParams.id_video.toString() : ''}
            comments={comments}
            setComments={setComments}
          />
          <CommentsList comments={comments} />
        </div>
      </div>
      <div className="col-span-3 m-4 grid ">
        {data?.map((item, index) => <CardVideo key={index} {...item} />)}
      </div>
    </div>
  );
}
