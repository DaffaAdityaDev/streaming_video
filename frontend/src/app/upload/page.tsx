'use client';
import React, { useState } from 'react';
import axios from 'axios';

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const Token = localStorage.getItem('token');
  console.log(Token);
  console.log('jamet');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedFile) {
      const formData = new FormData();
      formData.append('video', selectedFile);

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${Token}`, // Replace `yourAuthToken` with your actual token
            },
          },
        );
        console.log(response);
        // Handle successful response here
      } catch (error) {
        console.error('Error uploading file:', error);
        // Handle error here, e.g., show an error message to the user
      }
    }
  };

  return (
    <div className="col-span-11 row-span-5 w-full">
      <form onSubmit={handleFormSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          className="file-input file-input-bordered file-input-info w-full max-w-xs"
        />
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">What is your name?</span>
          </label>
          <input
            type="text"
            placeholder="Type here"
            className="input input-bordered w-full max-w-xs"
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Your bio</span>
            <span className="label-text-alt">Alt label</span>
          </label>
          <textarea className="textarea textarea-bordered h-24" placeholder="Bio"></textarea>
          <label className="label">
            <span className="label-text-alt">Your bio</span>
            <span className="label-text-alt">Alt label</span>
          </label>
        </div>
        <button type="submit">Upload</button>
      </form>
    </div>
  );
}
