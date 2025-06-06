import commentRepository from '../repository/commentRepository';
import userRepository from '../repository/userRepository';
import { CommentError } from '../utils/CommentError';

const createComment = async (body: string, id_video: number, email: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new CommentError('User not found');
  }
  return commentRepository.create(body, id_video, user.id_user);
};

const getComments = async (id_video: number) => {
  return commentRepository.findByVideoId(id_video);
};

const updateComment = async (id_comment: number, body: string) => {
  const comment = await commentRepository.update(id_comment, body);
  if (!comment) {
    throw new CommentError('Comment not found');
  }
  return commentRepository.update(id_comment, body);
};

const deleteComment = async (id_comment: number) => {
  const comment = await commentRepository.deleteComment(id_comment);
  if (!comment) {
    throw new CommentError('Comment not found');
  }
  return commentRepository.deleteComment(id_comment);
};

const getLastestComments = async (email: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new CommentError('User not found');
  }
  return commentRepository.getLastestComments(user.id_user);
};
export default { createComment, getComments, updateComment, deleteComment, getLastestComments };