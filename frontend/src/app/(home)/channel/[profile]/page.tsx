'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Page() {
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const BACKENDURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  // console.log(token)

  useEffect(() => {
    setToken(localStorage.getItem('token') || '');
    setImageUrl(localStorage.getItem('imageUrl') || '');
    setUsername(localStorage.getItem('username') || '');
  }, []);

  async function handleChangeImage(e: React.ChangeEvent<HTMLInputElement>) {
    const path = `${BACKENDURL}/uploadProfile`;
    if (!e.target.files || e.target.files.length === 0) return;
    console.log(e.target.files);
    const file = e.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('image', file);
    formData.append('username', username);
  
    try {
      const res = await axios.post(path, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setImageUrl(res.data.data.image_url);
      localStorage.setItem('imageUrl', res.data.data.image_url);
      toast.success('Profile image updated successfully!');
    } catch (error) {
      console.log(error);
      toast.error('Failed to update profile image. Please try again.');
    }
  }
  return (
    <div className="flex w-full justify-center gap-4">
      <div className="relative h-20 w-20">
        <img
          alt="Profile"
          src={`${BACKENDURL}/profileimages/${imageUrl}`}
          className="h-full w-full rounded-full bg-white object-cover"
          onError={(e) => {
            e.currentTarget.src = '/default-profile.jpg';
          }}
        />
        <input
          type="file"
          className="absolute left-0 top-0 h-full w-full opacity-0"
          onChange={handleChangeImage}
        />
      </div>
      <div>
        <label className="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
          </svg>
          <input type="text" className="grow" placeholder="Username" />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
            <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
          </svg>
          <input type="text" className="grow" placeholder="Email" />
        </label>
        <label className="input input-bordered flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-4 w-4 opacity-70"
          >
            <path
              fillRule="evenodd"
              d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
              clipRule="evenodd"
            />
          </svg>
          <input type="password" className="grow" value="password" />
        </label>
      </div>
    </div>
  );
}

export default Page;
