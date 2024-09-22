"use client"
import React, { useState } from 'react';
import { VideoDataType, UploadProgressItem, VideoResponse, CommentDataType, CommentResponse } from '@/app/types';
import axios from 'axios';
import { mutate } from 'swr';

interface DashboardProps {
  latestUploads: VideoResponse;
  latestComments: CommentResponse | undefined;
  uploadProgress: UploadProgressItem[];
  conversionProgress: number;
  conversionStep: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}
interface LatestUploadsProps {
  videos: VideoResponse;
}

interface LatestCommentsProps {
  comments: CommentDataType[];
}

interface UploadNewVideoProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  uploadProgress: UploadProgressItem[];
  conversionProgress: number;
  conversionStep: string | null;
}


const VideoDashboard: React.FC<DashboardProps> = ({
  latestUploads,
  latestComments,
  uploadProgress,
  conversionProgress,
  conversionStep,
  onFileChange,
  onSubmit,
}) => {
  return (
    <div className="bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Video Dashboard</h1>
        <select className="bg-blue-600 text-white px-4 py-2 rounded">
          <option>2023 - 2024</option>
          <option>2022 - 2023</option>
        </select>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Views" value="509,706" change={25.64} />
        <StatCard title="Total Likes" value="8,050" change={14.00} />
        <StatCard title="Total Comments" value="3,024" change={-25.13} />
        <StatCard title="Revenue" value="$4834.50" change={15.64} />
      </div>

      <UploadNewVideo
        onFileChange={onFileChange}
        onSubmit={onSubmit}
        uploadProgress={uploadProgress}
        conversionProgress={conversionProgress}
        conversionStep={conversionStep}
      />
      <div className="grid grid-cols-2 gap-8 my-8">
        <LatestUploads videos={latestUploads} />
        {/* <LatestComments comments={latestComments} /> */}
      </div>

    </div>
  );
};

const LatestUploads: React.FC<LatestUploadsProps> = ({ videos }) => {
  const videoList = videos.data;
  const [editingVideo, setEditingVideo] = useState<VideoDataType | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  console.log(videoList);

  if (!Array.isArray(videoList)) {
    console.error('Videos is not an array:', videoList);
    return <div>No videos available</div>;
  }

  const handleEdit = (video: VideoDataType) => {
    setEditingVideo(video);
    setIsEditing(true);
  }

  const handleDelete = async (id_video: number) => {
    console.log('Attempting to delete video with id:', id_video);
    if (window.confirm(`Are you sure you want to delete the video with ID ${id_video}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/${id_video}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log(`Video with ID ${id_video} deleted successfully`);
          // Update UI logic here (e.g., remove the video from the list)
        } else {
          const errorData = await response.json();
          console.error(`Failed to delete video with ID ${id_video}:`, errorData.message);
          // Provide user feedback
          alert(`Failed to delete video: ${errorData.message}`);
        }
      } catch (error) {
        console.error(`Error deleting video with ID ${id_video}:`, error);
        alert('An error occurred while deleting the video. Please try again.');
      }
    }
  }
  const handleSave = async (updatedVideo: VideoDataType) => {
    const email = localStorage.getItem('email');
    console.log(email);
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/${updatedVideo.id_video}`,
        {
          title_video: updatedVideo.title_video,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      
      mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/user/${btoa(email!)}`);
      setIsEditing(false);
    } catch (error) {

      console.error('Error updating video title:', error);
    }
  };




  return (
    <div className="bg-gray-800 p-6 rounded-lg">
    <h2 className="text-xl font-bold mb-4">Latest Uploads</h2>
    {videoList.length === 0 ? (
      <p>No recent uploads</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {videoList.map((video) => (
              <tr key={video.id_video}>
                <td>
                <img
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/thumbnail/${video.thumbnail}`}
                    alt={`Thumbnail for video ${video.id_video}`}
                    className="w-10 h-10 rounded"
                  />
                </td>
                <td>
                {isEditing && editingVideo && editingVideo.id_video === video.id_video ? (
                    <input
                      type="text"
                      value={editingVideo.title_video}
                      onChange={(e) => setEditingVideo({ ...editingVideo, title_video: e.target.value })}
                      className="input input-bordered input-sm"
                    />
                  ) : (
                    <p className='text-sm break-words'>{video.title_video}</p>
                  )}
                </td>
                <td>
                  <div className="flex space-x-2">
                    <a 
                      target='_blank' 
                      href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/stream/defaultQuality/${video.slug}`} 
                      className="btn btn-sm btn-success"
                    >
                      View
                    </a>
                    {isEditing && editingVideo && editingVideo.id_video === video.id_video ? (
                        <button 
                          onClick={() => editingVideo && handleSave(editingVideo)}
                          className="btn btn-sm btn-primary"
                        >
                          Save
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleEdit(video)}
                          className="btn btn-sm btn-info"
                        >
                          Edit
                        </button>
                      )}
                    <button 
                      onClick={() => handleDelete(video.id_video)}
                      className="btn btn-sm btn-error"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);
};


const LatestComments: React.FC<LatestCommentsProps> = ({ comments }) => {
  if (!Array.isArray(comments)) {
    console.error('Comments is not an array:', comments);
    return <div>No comments available</div>;
  }
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Latest Comments</h2>
      {comments?.length === 0 ? (
        <p>No recent comments</p>
      ) : (
        <ul>
          {comments?.map((comment) => (
            <li key={comment.id_comment} className="mb-2">
              <div className="flex items-center">
                <span className="font-bold mr-2">{comment.username}:</span>
                <span>{comment.body}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; change: number }> = ({ title, value, change }) => {
  const changeColor = change >= 0 ? 'text-green-500' : 'text-red-500';
  const changeIcon = change >= 0 ? '↑' : '↓';

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-gray-400 mb-2">{title}</h3>
      <p className="text-2xl font-bold mb-2">{value}</p>
      <p className={`${changeColor} text-sm`}>
        {changeIcon} {Math.abs(change)}%
      </p>
    </div>
  );
};

const UploadNewVideo: React.FC<UploadNewVideoProps> = ({
  onFileChange,
  onSubmit,
  uploadProgress,
  conversionProgress,
  conversionStep,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Upload New Video</h2>
      <form onSubmit={onSubmit} className="flex flex-col items-start">
        <input
          className="file-input file-input-bordered file-input-info w-full max-w-xs mb-4"
          accept=".mp4"
          type="file"
          name="video"
          onChange={onFileChange}
        />
        <button type="submit" className="btn btn-success">
          Upload
        </button>
      </form>
      {uploadProgress.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Upload Progress</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Resolution</th>
                  <th>Progress</th>
                  <th>Path</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Conversion</td>
                  <td>{conversionStep}</td>
                  <td>
                    <progress
                      className="progress progress-primary w-full"
                      value={conversionProgress}
                      max="100"
                    ></progress>
                  </td>
                  <td>-</td>
                </tr>
                {uploadProgress.map((progressItem, index) => (
                  <tr key={index}>
                    <td>{progressItem.file}</td>
                    <td>{progressItem.reso}</td>
                    <td>
                      <progress
                        className="progress progress-primary w-full"
                        value={progressItem.progress}
                        max="100"
                      ></progress>
                    </td>
                    <td>
                      {progressItem.path && (
                        <a href={progressItem.path} target="_blank" rel="noreferrer">
                          View
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const VideoList: React.FC<{ title: string; videos: VideoDataType[] }> = ({ title, videos }) => {
  if (!Array.isArray(videos)) {
    console.error(`Videos is not an array for ${title}:`, videos);
    return <div>No videos available</div>;
  }
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-700">
            <tr>
              <th className="p-3 text-left">Video</th>
              <th className="p-3 text-left">Views</th>
              <th className="p-3 text-left">Likes</th>
              <th className="p-3 text-left">Comments</th>
            </tr>
          </thead>
          <tbody>
            {videos?.map((video) => (
              <tr key={video.id_video} className="border-b border-gray-700">
                <td className="p-3">
                  <div className="flex items-center">
                    <img
                      src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/thumbnail/${video.thumbnail}`}
                      alt={video.title_video}
                      className="w-10 h-10 rounded mr-3"
                    />
                    <span>{video.title_video}</span>
                  </div>
                </td>
                <td className="p-3">{video.views}</td>
                <td className="p-3">{video.likes}</td>
                <td className="p-3">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VideoDashboard;