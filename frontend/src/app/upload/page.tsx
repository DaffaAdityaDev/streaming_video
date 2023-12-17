"use client"
import React, { useState } from 'react';
import axios from 'axios';

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFormSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData();
    formData.append('video', selectedFile);

    axios.post('http://localhost:8000/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then(response => {
      console.log(response);
    });
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
  )
}
