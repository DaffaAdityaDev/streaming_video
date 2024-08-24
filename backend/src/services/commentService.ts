import commentRepository from '../repository/commentRepository';
import userRepository from '../repository/userRepository';

const createComment = async (body: string, id_video: number, email: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }
  return commentRepository.create(body, id_video, user.id_user);
};

const getComments = async (id_video: number) => {
  return commentRepository.findByVideoId(id_video);
};

const updateComment = async (id_comment: number, body: string) => {
  return commentRepository.update(id_comment, body);
};

const deleteComment = async (id_comment: number) => {
  return commentRepository.deleteComment(id_comment);
};

export default { createComment, getComments, updateComment, deleteComment };