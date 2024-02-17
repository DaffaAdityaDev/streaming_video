"use client"
import axios from "axios"
import { useEffect, useState } from "react"
import io from 'socket.io-client';

export default function Page({
  params
}: {
  params: { userId: string }
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currTab, setCurrTab] = useState([
    { name: 'Upload', isActive: true },
    { name: 'My Video', isActive: false },
    { name: 'Tab 3', isActive: false }
  ])
  const [uploadProgress, setUploadProgress] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:8001');

    socket.on('uploadProgress', (data) => {
      // console.log("test", data.path);
      // console.log(`Upload progress for ${data.file}: ${data.progress}% reso${data.resolution}`);
      setUploadProgress((prevProgress) => {
        // Find the index of the existing progress object for this file and resolution
        const index = prevProgress.findIndex(item => item.file === data.file && item.reso === data.resolution);
        console.log(data);
        if (index !== -1) {
          // If the progress object for this file and resolution already exists, update it
          const updatedProgress = [...prevProgress];
          updatedProgress[index] = { ...updatedProgress[index], progress: data.progress};
          return updatedProgress;
        } else {
          // If the progress object for this file and resolution does not exist, add a new one
          return [...prevProgress, { file: data.file, progress: data.progress, reso: data.resolution, path: `http://localhost:8000/video/${data.resolution}/${data.file}.mp4`}];
        }
      });
      // Update your UI with the progress data
    });

    return () => {
      socket.disconnect();
    };
  }, [])
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedFile) { 
      alert('Please select a file')
      return
    }
    const formData = new FormData()
    formData.append('video', selectedFile)

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Video uploaded successfully!');
      console.log(response.data);
    } catch (error) {
      alert('Error uploading video.');
      console.error(error);
    }
  }
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div role="tablist" className="tabs tabs-bordered mb-20">
        {
          currTab.map((tab, index) => (
            <a
              key={index}
              className={`tab ${tab.isActive ? 'tab-active' : ''}`}
              onClick={() => {
                setCurrTab(currTab.map((t, i) => ({ ...t, isActive: i === index })))
              }}
            >
              {tab.name}
            </a>
          ))
        }
      </div>
      {
        currTab[0].isActive && (
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <input className="file-input file-input-bordered file-input-info w-full max-w-xs" accept=".mp4" type="file" name="video" onChange={handleFileChange} />
            <button type="submit" className="mt-4 btn btn-success">Upload</button>
          </form>
        )
      }
      {
        currTab[1].isActive && (
          <div>
            <h1>My Videos</h1>
          </div>
        )
      }
      {
        currTab[2].isActive && (
          <div>
            <h1>Tab 3</h1>
          </div>
        )
      }

      {uploadProgress?.map((progressItem, index) => (
        <div key={index}>
          <p>File: {progressItem.file}</p>
          <p>Progress: {progressItem.progress}%</p>
          <p>Resolution: {progressItem.reso}</p>
          <p>Path: {progressItem.path}</p>
        </div>
      ))}
      
    </div>
  )
}
