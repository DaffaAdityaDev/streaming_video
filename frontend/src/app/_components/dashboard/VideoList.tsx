
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ListVideo, VideoDataType } from '@/app/types';



export default function VideoList({ email } : any) {
 const [videos, setVideos] = useState<ListVideo[]>([]);
 console.log(email);
 console.log(videos);

 useEffect(() => {
    const fetchVideos = async () => {
      try {
        const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/videos`, { email });
        setVideos(response.data.data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      }
    };

    fetchVideos();
 }, [email]);

      return (
    <div>
      {videos?.map((video) => (
        <div key={video.id_video} className="video-item">
          <h3>{video.title_video}</h3>
          <p>Channel: {video.channel}</p>
          <p>Quality: {video.quality}</p>
          <p>Created At: {new Date(video.created_at).toLocaleDateString()}</p>
          <img src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/thumbnails/${video.thumbnail}`} alt={video.title_video} />
        </div>
      ))}
    </div>
);

}