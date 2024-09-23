// 'use client';
// import dynamic from 'next/dynamic';
// import { UploadProgressItem } from '@/app/types';
// import axios from 'axios';
// import { useEffect, useState } from 'react';
// import io from 'socket.io-client';
// import useSWR, { mutate } from 'swr';
// import { fetcher } from '@/utils/api';

// const VideoList = dynamic(() => import('@/components/dashboard/VideoList'), {
//   loading: () => <p>Loading video list...</p>,
// });

// export default function Page({ params }: { params: { userId: string } }) {
//   const [selectedFile, setSelectedFile] = useState<File | null>(null);
//   const [currTab, setCurrTab] = useState([
//     { name: 'Upload', isActive: true },
//     { name: 'My Video', isActive: false },
//     { name: 'Tab 3', isActive: false },
//   ]);

//   const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([]);
//   const [conversionProgress, setConversionProgress] = useState<number>(0);
//   const [conversionStep, setConversionStep] = useState<string | null>(null);
//   const [Token, setToken] = useState<string | null>(null);
//   const [usernames, setUsernames] = useState<string | null>(null);
//   const [email, setEmail] = useState<string | null>(null);
//   const { data: userVideos, error: userVideosError } = useSWR(
//     email ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/user/${btoa(email)}` : null,
//     fetcher,
//   );
//   console.log(Token);

//   useEffect(() => {
//     setToken(localStorage.getItem('token'));
//     setUsernames(localStorage.getItem('username'));
//     setEmail(localStorage.getItem('email'));
//   }, []);

//   useEffect(() => {
//     const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_WS_URL}`);

//     socket.on('uploadProgress', (data) => {
//       setUploadProgress((prevProgress) => {
//         const existingIndex = prevProgress.findIndex((item) => item.reso === data.resolution);
//         if (existingIndex !== -1) {
//           return prevProgress.map((item, index) =>
//             index === existingIndex ? { ...item, progress: data.progress } : item,
//           );
//         } else {
//           return [
//             ...prevProgress,
//             {
//               file: data.file,
//               progress: data.progress,
//               reso: data.resolution,
//               path: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/stream/${data.resolution}/${data.file}`,
//             },
//           ];
//         }
//       });
//     });

//     socket.on('processingProgress', (data) => {
//       setUploadProgress((prevProgress) => {
//         const existingIndex = prevProgress.findIndex((item) => item.reso === data.resolution);
//         if (existingIndex !== -1) {
//           return prevProgress.map((item, index) =>
//             index === existingIndex ? { ...item, progress: data.progress } : item,
//           );
//         } else {
//           return [
//             ...prevProgress,
//             {
//               file: data.file,
//               progress: data.progress,
//               reso: data.resolution,
//               path: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/stream/${data.resolution}/${data.file}`,
//             },
//           ];
//         }
//       });
//     });

//     socket.on('conversionProgress', (data) => {
//       if (data.step === 'progress') {
//         setConversionProgress(data.progress);
//       } else {
//         setConversionStep(data.message);
//       }
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, []);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files.length > 0) {
//       setSelectedFile(e.target.files[0]);
//     }
//   };

//   const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     if (!selectedFile || !Token) {
//       alert(selectedFile ? 'You are not authenticated. Please log in.' : 'Please select a file');
//       return;
//     }
//     const formData = new FormData();
//     formData.append('video', selectedFile);

//     try {
//       setUploadProgress([
//         {
//           file: selectedFile.name,
//           progress: 0,
//           reso: 'upload',
//           path: '',
//         },
//       ]);

//       const response = await axios.post(
//         `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/upload`,
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//             Authorization: `Bearer ${Token}`,
//           },
//           onUploadProgress: (progressEvent) => {
//             const percentCompleted = Math.round(
//               (progressEvent.loaded * 100) / progressEvent.total!,
//             );
//             setUploadProgress((prevProgress) => [
//               {
//                 ...prevProgress[0],
//                 progress: percentCompleted,
//               },
//             ]);
//           },
//         },
//       );
//       console.log('Upload response:', response.data);
//       mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/user/${email}`);
//     } catch (error) {
//       console.error('Error uploading video:', error);
//       if (axios.isAxiosError(error) && error.response) {
//         alert(`Error uploading video: ${error.response.data.message || error.message}`);
//       } else {
//         alert(`Error uploading video: ${(error as Error).message}`);
//       }
//     }
//   };

//   return (
//     <div className="flex h-full w-full flex-col items-center justify-center">
//       <div role="tablist" className="tabs tabs-bordered mb-20">
//         {currTab.map((tab, index) => (
//           <a
//             key={index}
//             className={`tab ${tab.isActive ? 'tab-active' : ''}`}
//             onClick={() => {
//               setCurrTab(currTab.map((t, i) => ({ ...t, isActive: i === index })));
//             }}
//           >
//             {tab.name}
//           </a>
//         ))}
//       </div>
//       {currTab[0].isActive && (
//         <div>
//           <form onSubmit={handleSubmit} className="flex flex-col items-center">
//             <input
//               className="file-input file-input-bordered file-input-info w-full max-w-xs"
//               accept=".mp4"
//               type="file"
//               name="video"
//               onChange={handleFileChange}
//             />
//             <button type="submit" className="btn btn-success mt-4">
//               Upload
//             </button>
//           </form>
//           {uploadProgress.length > 0 && (
//             <div className="overflow-x-auto">
//               <table className="table">
//                 <thead>
//                   <tr>
//                     <th>no</th>
//                     <th>slug</th>
//                     <th>File</th>
//                     <th>Progress</th>
//                     <th>Path</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   <tr>
//                     <th>1</th>
//                     <td>Conversion</td>
//                     <td>{conversionStep}</td>
//                     <td>
//                       <progress
//                         className="progress progress-primary w-56"
//                         value={conversionProgress}
//                         max="100"
//                       ></progress>
//                     </td>
//                     <td>-</td>
//                   </tr>
//                   {uploadProgress.map((progressItem, index) => (
//                     <tr key={index}>
//                       <th>{index + 2}</th>
//                       <td>{progressItem.file}</td>
//                       <td>{progressItem.reso}</td>
//                       <td>
//                         <progress
//                           className="progress progress-primary w-56"
//                           value={progressItem.progress}
//                           max="100"
//                         ></progress>
//                       </td>
//                       <td>
//                         <a href={progressItem.path} target="_blank" rel="noreferrer">
//                           View
//                         </a>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       )}
//       {currTab[1].isActive && (
//         <div>
//           {userVideosError && <div>Failed to load videos</div>}
//           {!userVideos && <div>Loading...</div>}
//           {userVideos && email && <VideoList videos={userVideos} email={email} />}
//         </div>
//       )}
//       {currTab[2].isActive && (
//         <div>
//           <h1>Tab 3</h1>
//         </div>
//       )}
//     </div>
//   );
// }

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

    socket.on('uploadProgress', (data) => {
      setUploadProgress((prevProgress) => {
        const existingIndex = prevProgress.findIndex((item) => item.reso === data.resolution);
        if (existingIndex !== -1) {
          return prevProgress.map((item, index) =>
            index === existingIndex ? { ...item, progress: data.progress } : item,
          );
        } else {
          return [
            ...prevProgress,
            {
              file: data.file,
              progress: data.progress,
              reso: data.resolution,
              path: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/stream/${data.resolution}/${data.file}`,
            },
          ];
        }
      });
    });

    socket.on('processingProgress', (data) => {
      setUploadProgress((prevProgress) => {
        const existingIndex = prevProgress.findIndex((item) => item.reso === data.resolution);
        if (existingIndex !== -1) {
          return prevProgress.map((item, index) =>
            index === existingIndex ? { ...item, progress: data.progress } : item,
          );
        } else {
          return [
            ...prevProgress,
            {
              file: data.file,
              progress: data.progress,
              reso: data.resolution,
              path: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/stream/${data.resolution}/${data.file}`,
            },
          ];
        }
      });
    });

    socket.on('conversionProgress', (data) => {
      if (data.step === 'progress') {
        setConversionProgress(data.progress);
      } else {
        setConversionStep(data.message);
      }
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