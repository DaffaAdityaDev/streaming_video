'use client';
import dynamic from 'next/dynamic';
import { UploadProgressItem, VideoResponse, CommentDataType, CommentResponse } from '@/app/types';
import axios from 'axios';
import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import useSWR, { mutate } from 'swr';
import { fetcher } from '@/utils/api';
import { toast } from 'react-toastify';
import { handleApiError } from '@/utils/errorHandler';

const VideoDashboard = dynamic(() => import('@/components/dashboard/VideoDashboard'), {
  loading: () => <p>Loading dashboard...</p>,
});

export default function Page({ params }: { params: { userId: string } }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([]);
  const [conversionProgress, setConversionProgress] = useState<number>(0);
  const [conversionStep, setConversionStep] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  const { data: userVideos, error: userVideosError } = useSWR<VideoResponse>(
    email ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/user/${btoa(email)}` : null,
    fetcher
  );

  const { data: latestComments, error: latestCommentsError } = useSWR<CommentResponse>(
    email ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/comment/latest/${btoa(email)}` : null,
    fetcher
  );

  // console.log(latestComments);
 

  useEffect(() => {
    setToken(localStorage.getItem('token'));
    setEmail(localStorage.getItem('email'));

    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_WS_URL}`);

    socket.on('conversionProgress', (data) => {
      setConversionStep(data.message);
      if (data.step === 'progress') {
        setConversionProgress(data.progress);
      }
    });

    socket.on('uploadProgress', (data) => {
      setUploadProgress((prevProgress) => {
        const existingIndex = prevProgress.findIndex((item) => item.reso === data.resolution);
        if (existingIndex !== -1) {
          return prevProgress.map((item, index) =>
            index === existingIndex ? { ...item, progress: data.progress } : item
          );
        } else {
          const newItem = {
            file: data.file,
            progress: data.progress,
            reso: data.resolution,
            path: data.resolution === 'upload' || data.resolution === 'overall' ? '' :
              `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/stream/${data.resolution}/${data.file}`,
          };
          
          // Insert new item in the correct order
          const newProgress = [...prevProgress];
          if (data.resolution === 'upload') {
            newProgress.unshift(newItem);
          } else if (data.resolution === 'overall') {
            newProgress.splice(1, 0, newItem);
          } else {
            // For resolution-specific items, insert them after 'overall'
            const overallIndex = newProgress.findIndex(item => item.reso === 'overall');
            newProgress.splice(overallIndex + 1, 0, newItem);
          }
          return newProgress;
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile || !token) {
      toast.error(selectedFile ? 'You are not authenticated. Please log in.' : 'Please select a file');
      return;
    }
    const formData = new FormData();
    formData.append('video', selectedFile);
  
    try {
      setUploadProgress([
        {
          file: selectedFile.name,
          progress: 0,
          reso: 'upload',
          path: '',
        },
      ]);
  
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total!,
            );
            setUploadProgress((prevProgress) => [
              {
                ...prevProgress[0],
                progress: percentCompleted,
              },
            ]);
          },
        },
      );
      console.log('Upload response:', response.data);
      toast.success('Video uploaded successfully!');
      mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/user/${email}`);
    } catch (error) {
      handleApiError(error);
    }
  };

  if (userVideosError) return <div>Failed to load videos</div>;
  if (!userVideos) return <div>Loading...</div>;

  

  return (
    <VideoDashboard
      latestUploads={userVideos}
      latestComments={latestComments ?? { data: [] }}
      uploadProgress={uploadProgress}
      conversionProgress={conversionProgress}
      conversionStep={conversionStep}
      onFileChange={handleFileChange}
      onSubmit={handleSubmit}
    />
  );
}