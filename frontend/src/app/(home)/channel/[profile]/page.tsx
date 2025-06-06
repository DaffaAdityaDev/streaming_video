'use client';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '@/hooks/useAuth';

function Page() {
  const { changeUsername } = useAuth();
  const [token, setToken] = useState('');
  const [username, setUsername] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  const APIVERSION = process.env.NEXT_PUBLIC_BACKEND_API_VERSION;
  const BACKENDURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const BASE_API_URL = `${BACKENDURL}/api/${APIVERSION}`;

  console.log(email);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    } else {
      // Handle the case when there's no token (user not logged in)
      toast.error('You are not logged in. Please log in to update your profile.');
      // Optionally, redirect to login page
    }
    setImageUrl(localStorage.getItem('imageUrl') || '');
    setUsername(localStorage.getItem('username') || '');
    setEmail(localStorage.getItem('email') || '');
  }, []);

  async function handleChangeImage(e: React.ChangeEvent<HTMLInputElement>) {
    const path = `${BASE_API_URL}/user/upload-profile`;
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post(path, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.data.status === 'success') {
        setImageUrl(res.data.data.image_url);
        localStorage.setItem('imageUrl', res.data.data.image_url);
        toast.success('Profile image updated successfully!');
      } else {
        throw new Error(res.data.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Your session has expired. Please log in again.');
        // Optionally, you can trigger a logout or redirect to login page here
      } else {
        toast.error('Failed to update profile image. Please try again.');
      }
    }
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isStrongPassword = (password: string) => {
    return password.length >= 6;
  };

  const isValidUsername = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'username':
        setNewUsername(value);
        break;
      case 'email':
        setNewEmail(value);
        break;
      case 'password':
        setNewPassword(value);
        break;
    }
    setChangedFields((prev) => new Set(prev.add(field)));
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const updatedFields: { [key: string]: string } = {
      currentEmail: email, // Always include the current email
    };

    let hasValidChanges = false;

    Array.from(changedFields).forEach((field) => {
      let value = '';
      switch (field) {
        case 'username':
          value = newUsername.trim();
          if (value !== '' && value !== username) {
            if (isValidUsername(value)) {
              updatedFields.username = value;
              hasValidChanges = true;
            } else {
              toast.error(
                'Invalid username format (3-20 characters, alphanumeric and underscores allowed)',
              );
              return;
            }
          }
          break;
        case 'email':
          value = newEmail.trim();
          if (value !== '' && value !== email) {
            if (isValidEmail(value)) {
              updatedFields.email = value;
              hasValidChanges = true;
            } else {
              toast.error('Invalid email format (example: example@gmail.com)');
              return;
            }
          }
          break;
        case 'password':
          value = newPassword.trim();
          if (value !== '') {
            if (isStrongPassword(value)) {
              updatedFields.password = value;
              hasValidChanges = true;
            } else {
              toast.error('Password must be at least 6 characters long');
              return;
            }
          }
          break;
      }
    });

    if (!hasValidChanges) {
      toast.info('No changes to save');
      return;
    }

    try {
      const response = await axios.put(`${BASE_API_URL}/user/update-profile`, updatedFields, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.status === 'success') {
        toast.success('Profile updated successfully');
        if (updatedFields.username) {
          setUsername(updatedFields.username);
          localStorage.setItem('username', updatedFields.username);
        }
        if (updatedFields.email) {
          setEmail(updatedFields.email);
          localStorage.setItem('email', updatedFields.email);
        }
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        setChangedFields(new Set());
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Failed to update profile: ${error.response.data.message}`);
      } else {
        toast.error('Failed to update profile. Please try again.');
      }
    }
  };

  return (
    <div className="flex w-full justify-center gap-4 text-black">
      <div className="absolute left-0 top-0 -z-10 h-[25%] w-full">
        <img
          alt="background"
          src="/background/background-profile.jpg"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="mt-20 flex gap-4">
        <div className="flex flex-col items-center gap-2 rounded-xl bg-white p-10">
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
          <p>{username}</p>
          <p>{email}</p>
        </div>
        <div className="w-full max-w-2xl rounded-xl bg-white">
          <div className="border-b-2 border-gray-400 p-4">
            <p className="text-xl">Account Settings</p>
          </div>
          <form onSubmit={handleSave} className="flex flex-wrap gap-4 p-4">
            <div className="flex w-full flex-col gap-4 sm:w-[calc(50%-0.5rem)]">
              <div className="flex flex-col gap-2">
                <p>Username</p>
                <label className="input input-bordered flex w-full items-center gap-2 bg-slate-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="black"
                    className="h-4 w-4 opacity-70"
                  >
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                  <input
                    type="text"
                    className="grow bg-slate-100"
                    placeholder="New Username"
                    value={newUsername}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <p>Password</p>
                <label className="input input-bordered flex w-full items-center gap-2 bg-slate-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="black"
                    className="h-4 w-4 opacity-70"
                  >
                    <path
                      fillRule="evenodd"
                      d="M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <input
                    type="password"
                    className="grow bg-slate-100"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className="w-full sm:w-[calc(50%-0.5rem)]">
              <div className="flex flex-col gap-2">
                <p>Email</p>
                <label className="input input-bordered flex w-full items-center gap-2 bg-slate-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="black"
                    className="h-4 w-4 opacity-70"
                  >
                    <path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z" />
                    <path d="M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z" />
                  </svg>
                  <input
                    type="email"
                    className="grow bg-slate-100"
                    placeholder="New Email"
                    value={newEmail}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </label>
              </div>
            </div>
            <div className="flex w-full justify-end p-4">
              <button
                type="submit"
                className={`btn ${
                  changedFields.size > 0 ? 'btn-success' : 'btn-disabled'
                } w-24 text-white`}
                disabled={changedFields.size === 0}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Page;
