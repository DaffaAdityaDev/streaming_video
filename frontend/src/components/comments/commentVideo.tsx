import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserData } from '@/app/types';
import { postData } from '@/utils/api';
import { toast } from 'react-toastify';
import { mutate } from 'swr';

export default function CommentVideo({
  id_video,
  mutate,
}: {
  id_video: string;
  mutate: (key?: string, data?: any, options?: any) => Promise<any>;
}) {
  const [userData, setUserData] = useState<UserData>({
    username: '',
    email: '',
    token: '',
  });
  const [comment, setComment] = useState('');

  function getCommentsFromAPI(path: string) {
    return axios.get(path).then((response) => {
      return response.data;
    });
  }

  useEffect(() => {
    const email = localStorage.getItem('email') || '';
    const username = localStorage.getItem('username') || '';
    const token = localStorage.getItem('token') || '';
    const user: UserData = { username, email, token };
    setUserData(user);
  }, []);

  function handleCommentInput(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setComment(event.target.value);
  }

  async function handleComment() {
    let data = {
      body: comment,
      id_video: parseInt(id_video),
      email: userData.email,
    };

    try {
      const response = await postData('/api/v1/comment', data, userData.token);
      console.log('Comment posted:', response.data);
      if (response.data) {
        setComment('');
        toast.success('Comment posted successfully');

        // Revalidate the comments data
        await mutate(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/comment/${id_video}`);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(`Error posting comment: ${error.response.data.message || error.message}`);
      } else {
        toast.error(`Error posting comment: ${(error as Error).message}`);
      }
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-10">
      <h2 className="text-2xl">Comments</h2>
      <textarea
        className="textarea textarea-primary w-full"
        placeholder="Comment the video"
        value={comment}
        onChange={handleCommentInput}
      ></textarea>
      <button className="btn btn-outline btn-accent w-20 self-end" onClick={handleComment}>
        Comment
      </button>
    </div>
  );
}
