'use client';
import React, { useState, useEffect } from 'react';
import {
  VideoDataType,
  UploadProgressItem,
  VideoResponse,
  CommentDataType,
  CommentResponse,
} from '@/app/types';
import axios from 'axios';
import { mutate } from 'swr';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

interface DashboardProps {
  latestUploads: VideoResponse;
  latestComments: CommentResponse | undefined;
  uploadProgress: UploadProgressItem[];
  conversionProgress: number;
  conversionStep: string | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  refreshVideos: () => void;
}
interface LatestUploadsProps {
  videos: VideoResponse;
  refreshVideos: () => void;
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
  refreshVideos: () => void;
}

const VideoDashboard: React.FC<DashboardProps> = ({
  latestUploads,
  latestComments,
  uploadProgress,
  conversionProgress,
  conversionStep,
  onFileChange,
  onSubmit,
  refreshVideos,
}) => {
  return (
    <div className="bg-gray-900 p-6 text-white">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Video Dashboard</h1>
        <select className="rounded bg-blue-600 px-4 py-2 text-white">
          <option>2023 - 2024</option>
          <option>2022 - 2023</option>
        </select>
      </div>

      <div className="mb-8 grid grid-cols-4 gap-4">
        <StatCard title="Total Views" value="509,706" change={25.64} />
        <StatCard title="Total Likes" value="8,050" change={14.0} />
        <StatCard title="Total Comments" value="3,024" change={-25.13} />
        <StatCard title="Revenue" value="$4834.50" change={15.64} />
      </div>

      <UploadNewVideo
        onFileChange={onFileChange}
        onSubmit={onSubmit}
        uploadProgress={uploadProgress}
        conversionProgress={conversionProgress}
        conversionStep={conversionStep}
        refreshVideos={refreshVideos}
      />
      <div className="my-8 grid grid-cols-2 gap-8">
        <LatestUploads videos={latestUploads} refreshVideos={refreshVideos} />
        {/* <LatestComments comments={latestComments} /> */}
      </div>
    </div>
  );
};

const LatestUploads: React.FC<LatestUploadsProps> = ({ videos, refreshVideos }) => {
  const [videoList, setVideoList] = useState<VideoDataType[]>(videos.data);
  const [editingVideo, setEditingVideo] = useState<VideoDataType | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  console.log(videoList);
  console.log(editingVideo);

  if (!Array.isArray(videoList)) {
    console.error('Videos is not an array:', videoList);
    return <div>No videos available</div>;
  }

  const handleEdit = (video: VideoDataType) => {
    setEditingVideo(video);
    setEditedTitle(video.title_video);
    setEditedDescription(video.description || '');
    setChangedFields(new Set());
    setIsEditing(true);
  };

  const handleCloseEdit = () => {
    setIsEditing(false);
    setImagePreview(null);
    setChangedFields(new Set());
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'title') {
      setEditedTitle(value);
    } else if (field === 'description') {
      setEditedDescription(value);
    }

    if (editingVideo) {
      if (
        (field === 'title' && value !== editingVideo.title_video) ||
        (field === 'description' && value !== editingVideo.description)
      ) {
        setChangedFields(prev => new Set(prev).add(field));
      } else {
        setChangedFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(field);
          return newSet;
        });
      }
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && editingVideo) {
      const file = e.target.files[0];
      setChangedFields(prev => new Set(prev).add('thumbnail'));
      
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleDelete = async (id_video: number) => {
    console.log('Attempting to delete video with id:', id_video);
    if (window.confirm(`Are you sure you want to delete the video with ID ${id_video}?`)) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/${id_video}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        if (response.ok) {
          toast.success(`Video with ID ${id_video} deleted successfully`);
          refreshVideos();
          console.log(`Video with ID ${id_video} deleted successfully`);
          // Update UI logic here (e.g., remove the video from the list)
        } else {
          const errorData = await response.json();
          console.error(`Failed to delete video with ID ${id_video}:`, errorData.message);
          toast.error(`Failed to delete video with ID ${id_video}:`, errorData.message);
        }
      } catch (error) {
        console.error(`Error deleting video with ID ${id_video}:`, error);
        toast.error('An error occurred while deleting the video. Please try again.');
      }
    }
  };
  const handleSave = async () => {
    if (!editingVideo) return;

    const updatedFields: Partial<VideoDataType> = {};
    const formData = new FormData();

    if (changedFields.has('title')) {
      updatedFields.title_video = editedTitle;
    }
    if (changedFields.has('description')) {
      updatedFields.description = editedDescription;
    }

    try {
      if (Object.keys(updatedFields).length > 0) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/${editingVideo.id_video}`,
          updatedFields,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
      }

      if (changedFields.has('thumbnail')) {
        const thumbnailInput = document.getElementById('thumbnailInput') as HTMLInputElement;
        if (thumbnailInput && thumbnailInput.files && thumbnailInput.files.length > 0) {
          formData.append('thumbnail', thumbnailInput.files[0]);
          await axios.put(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/${editingVideo.slug}/thumbnail`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
          );
        }
      }

      refreshVideos();
      setIsEditing(false);
setImagePreview(null);
setChangedFields(new Set());
if (imagePreview) {
  URL.revokeObjectURL(imagePreview);
  setImagePreview(null);
}
      
      toast.success('Video details updated successfully');
    } catch (error) {
      console.error('Error updating video details:', error);
      toast.error('Failed to update video details. Please try again.');
    }
  };


  const handleThumbnailUpdate = async (videoSlug: string, file: File) => {
    const formData = new FormData();
    formData.append('thumbnail', file);

    console.log(videoSlug);

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/${videoSlug}/thumbnail`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        },
      );

      if (response.data.status === 'success') {
        refreshVideos();
        toast.success('Thumbnail updated successfully');
      } else {
        throw new Error(response.data.message || 'Failed to update thumbnail');
      }
    } catch (error) {
      console.error('Error updating thumbnail:', error);
      toast.error('Failed to update thumbnail. Please try again.');
    }
  };

  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <h2 className="mb-4 text-xl font-bold">Latest Uploads</h2>
      {videoList.length === 0 ? (
        <p>No recent uploads</p>
      ) : (
        <div className="overflow-x-auto">
          {isEditing && editingVideo && (
            <div className="fixed left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black/50">
              <div className="relative flex h-full w-full items-center justify-center">
              <button
  className="btn btn-circle btn-sm absolute right-0 top-0 m-4 bg-red-600 text-white"
  onClick={handleCloseEdit}
>
  X
</button>
                <div className="flex flex-col gap-4 rounded-lg bg-white p-4 text-black">
                  <p>Editing video Details</p>
                  <div className="relative h-fit w-full">
                    <p>Thumbnail</p>
                    <div className="relative h-fit w-full">
                      <div className="absolute left-0 top-0 h-full w-full rounded-md opacity-0 hover:cursor-pointer hover:opacity-100">
                        <div className="absolute left-0 top-0 flex h-full w-full items-center justify-center rounded-md bg-black/50 text-white">
                          change thumbnail
                        </div>
                        <input
                          id="thumbnailInput"
                          type="file"
                          accept=".jpg, .jpeg, .png"
                          className="absolute left-0 top-0 h-full w-full opacity-0 hover:cursor-pointer"
                          onChange={handleThumbnailChange}
                        />
                      </div>
                      <img
  src={imagePreview || `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/thumbnail/${editingVideo.thumbnail}`}
  alt={editingVideo.title_video}
  className="h-40 w-full object-contain"
/>
                    </div>
                  </div>
                  <div>
                    <p>Title</p>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="input input-bordered input-info w-full max-w-xs bg-white text-black"
                    />
                  </div>
                  <div className="w-full">
                    <p>Description</p>
                    <textarea
                      value={editedDescription}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      className="textarea textarea-info w-full bg-white text-black"
                      placeholder="Description"
                    ></textarea>
                  </div>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={handleSave}
                    disabled={changedFields.size === 0}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
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
                      className="h-10 w-10 rounded"
                    />
                  </td>
                  <td>
                    {isEditing && editingVideo && editingVideo.id_video === video.id_video ? (
                      <input
                        type="text"
                        value={editingVideo.title_video}
                        onChange={(e) =>
                          setEditingVideo({ ...editingVideo, title_video: e.target.value })
                        }
                        className="input input-bordered input-sm"
                      />
                    ) : (
                      <p className="break-words text-sm max-w-[20ch] truncate">{video.title_video}</p>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <a
                        target="_blank"
                        href={`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/video/stream/defaultQuality/${video.slug}`}
                        className="btn btn-success btn-sm"
                      >
                        View
                      </a>
                      {/* {isEditing && editingVideo && editingVideo.id_video === video.id_video ? (
                        <button
                          onClick={() => editingVideo && handleSave(editingVideo)}
                          className="btn btn-primary btn-sm"
                        >
                          Save
                        </button>
                      ) : ( */}
                        <button onClick={() => handleEdit(video)} className="btn btn-info btn-sm">
                          Edit
                        </button>
                      {/* )} */}
                      <button
                        onClick={() => handleDelete(video.id_video)}
                        className="btn btn-error btn-sm"
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
    <div className="rounded-lg bg-gray-800 p-6">
      <h2 className="mb-4 text-xl font-bold">Latest Comments</h2>
      {comments?.length === 0 ? (
        <p>No recent comments</p>
      ) : (
        <ul>
          {comments?.map((comment) => (
            <li key={comment.id_comment} className="mb-2">
              <div className="flex items-center">
                <span className="mr-2 font-bold">{comment.username}:</span>
                <span>{comment.body}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; change: number }> = ({
  title,
  value,
  change,
}) => {
  const changeColor = change >= 0 ? 'text-green-500' : 'text-red-500';
  const changeIcon = change >= 0 ? '↑' : '↓';

  return (
    <div className="rounded-lg bg-gray-800 p-4">
      <h3 className="mb-2 text-gray-400">{title}</h3>
      <p className="mb-2 text-2xl font-bold">{value}</p>
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
  refreshVideos,
}) => {
  const [resolutionProgress, setResolutionProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_WS_URL}`);

    socket.on('conversionProgress', (data) => {
      if (data.step === 'progress') {
        setResolutionProgress((prev) => ({
          ...prev,
          [data.resolution]: data.progress,
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sortedProgress = [...uploadProgress].sort((a, b) => {
    const order = ['upload', 'overall', '144p', '240p', '480p', '720p', '1080p', '4k'];
    return order.indexOf(a.reso) - order.indexOf(b.reso);
  });

  return (
    <div className="rounded-lg bg-gray-800 p-6">
      <h2 className="mb-4 text-xl font-bold">Upload New Video</h2>
      <form onSubmit={onSubmit} className="flex flex-col items-start">
        <input
          className="file-input file-input-bordered file-input-info mb-4 w-full max-w-xs"
          accept=".mp4"
          type="file"
          name="video"
          onChange={onFileChange}
        />
        <button type="submit" className="btn btn-success">
          Upload
        </button>
      </form>
      {sortedProgress.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-lg font-semibold">Upload Progress</h3>
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
                {sortedProgress.map((progressItem, index) => (
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
      <div className="mt-4">
        <h3 className="mb-2 text-lg font-semibold">Conversion Progress</h3>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Resolution</th>
                <th>Progress</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(resolutionProgress).map(([resolution, progress]) => (
                <tr key={resolution}>
                  <td>{resolution}</td>
                  <td>
                    <progress
                      className="progress progress-primary w-full"
                      value={progress}
                      max="100"
                    ></progress>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      <div className="overflow-hidden rounded-lg bg-gray-800">
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
                      className="mr-3 h-10 w-10 rounded"
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
