'use client'
import { UploadProgressItem } from '@/app/types'
import axios from 'axios'
import { useEffect, useState } from 'react'
import io from 'socket.io-client'

export default function Page({ params }: { params: { userId: string } }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currTab, setCurrTab] = useState([
    { name: 'Upload', isActive: true },
    { name: 'My Video', isActive: false },
    { name: 'Tab 3', isActive: false },
  ])
  const [uploadProgress, setUploadProgress] = useState<UploadProgressItem[]>([])

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_BACKEND_WS_URL}`)

    socket.on('uploadProgress', (data) => {
      // console.log("test", data.path);
      // console.log(`Upload progress for ${data.file}: ${data.progress}% reso${data.resolution}`);
      setUploadProgress((prevProgress) => {
        // Find the index of the existing progress object for this file and resolution
        const index = prevProgress.findIndex(
          (item) => item.file === data.file && item.reso === data.resolution,
        )
        // console.log(data);
        if (index !== -1) {
          // If the progress object for this file and resolution already exists, update it
          const updatedProgress = [...prevProgress]
          updatedProgress[index] = { ...updatedProgress[index], progress: data.progress }
          return updatedProgress
        } else {
          // If the progress object for this file and resolution does not exist, add a new one
          return [
            ...prevProgress,
            {
              file: data.file,
              progress: data.progress,
              reso: data.resolution,
              path: `${process.env.NEXT_PUBLIC_BACKEND_URL}/video/${data.resolution}/${data.file}.mp4`,
            },
          ]
        }
      })
      // Update your UI with the progress data
    })

    return () => {
      socket.disconnect()
    }
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
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      alert('Video uploaded successfully!')
      // console.log(response.data);
    } catch (error) {
      alert('Error uploading video.')
      // console.error(error);
    }
  }
  return (
    <div className="flex h-full w-full flex-col items-center justify-center">
      <div role="tablist" className="tabs tabs-bordered mb-20">
        {currTab.map((tab, index) => (
          <a
            key={index}
            className={`tab ${tab.isActive ? 'tab-active' : ''}`}
            onClick={() => {
              setCurrTab(currTab.map((t, i) => ({ ...t, isActive: i === index })))
            }}
          >
            {tab.name}
          </a>
        ))}
      </div>
      {currTab[0].isActive && (
        <div>
          <form onSubmit={handleSubmit} className="flex flex-col items-center">
            <input
              className="file-input file-input-bordered file-input-info w-full max-w-xs"
              accept=".mp4"
              type="file"
              name="video"
              onChange={handleFileChange}
            />
            <button type="submit" className="btn btn-success mt-4">
              Upload
            </button>
          </form>
          {uploadProgress.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table">
                {/* head */}
                <thead>
                  <tr>
                    <th>no</th>
                    <th>slug</th>
                    <th>File</th>
                    <th>Progress</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadProgress.map((progressItem, index) => (
                    <tr key={index}>
                      <th>{index + 1}</th>
                      <td>{progressItem.file}</td>
                      <td>{progressItem.reso}</td>
                      <td>
                        <progress
                          className="progress progress-primary w-56"
                          value={progressItem.progress}
                          max="100"
                        ></progress>
                      </td>
                      <td>
                        <a href={progressItem.path} target="_blank" rel="noreferrer">
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {currTab[1].isActive && (
        <div>
          <h1>My Videos</h1>
        </div>
      )}
      {currTab[2].isActive && (
        <div>
          <h1>Tab 3</h1>
        </div>
      )}
    </div>
  )
}
