"use client"
import axios from "axios"
import { useState } from "react"

export default function Page({
  params
}: {
  params: { userId: string }
}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
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
    <div>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".mp4" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>
    </div>
  )
}
