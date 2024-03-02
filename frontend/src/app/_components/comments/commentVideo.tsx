import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { UserData } from '@/app/types';
export default function CommentVideo() {
  const [userData, setUserData] = useState<UserData>({
    username: '',
    email: '',
    token: '',
  });
  const [comment, setComment] = useState('');

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

  function handleComment() {
    let data = {
      body: comment,
      id_video: 1,
      email: userData.email,
    };

    let postComment = axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/comments`, data, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userData.token}`,
      },
    });
    postComment
      .then((response) => {
        console.log(response.data);
        if (response.data) {
          setComment('');
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // console.log(comment)

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
