import React, { useState, useEffect, use } from 'react';
import axios from 'axios';
import { Comment } from '@/app/types';

export default function CommentsList({ id_video }: { id_video: string }) {
  const [comments, setComments] = useState<Comment[]>([]);

  function getCommentsFromAPI(path: string) {
    return axios.get(path).then((response) => {
      return response.data;
    });
  }

  useEffect(() => {
    const fetchData = async () => {
      const comments = await getCommentsFromAPI(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/comments/${id_video}`,
      );
      setComments(comments.data);
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {comments.map((comment, index) => {
        let formatedDate = new Date(comment.created_at).toLocaleDateString();
        return (
          <div
            className="flex flex-col gap-2 rounded-md border border-sky-300 p-4 text-white"
            key={index}
          >
            <div className="flex gap-2">
              <div className="avatar">
                <div className="w-14 rounded-full">
                  <img src="https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif" alt="foto" />
                </div>
              </div>
              <div>
                <p className="text-xl">{comment.user.username}</p>
                <p className="text-sm text-gray-400">{formatedDate}</p>
              </div>
            </div>
            <div>
              <p>{comment.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
