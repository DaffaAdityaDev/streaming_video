import { PrismaClient, Comments } from '@prisma/client';

const prisma = new PrismaClient();

const create = async (body: string, id_video: number, id_user: number): Promise<Comments> => {
  return prisma.comments.create({
    data: { body, id_video, id_user },
  });
};

const findByVideoId = async (id_video: number): Promise<Comments[]> => {
  return prisma.comments.findMany({
    where: { id_video },
    include: { user: true },
  });
};

const update = async (id_comment: number, body: string): Promise<Comments> => {
  return prisma.comments.update({
    where: { id_comment },
    data: { body },
  });
};

const deleteComment = async (id_comment: number): Promise<Comments> => {
  return prisma.comments.delete({
    where: { id_comment },
  });
};

export default { create, findByVideoId, update, deleteComment }; 