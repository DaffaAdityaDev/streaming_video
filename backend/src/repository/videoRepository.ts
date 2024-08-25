import { PrismaClient, Videos, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const findBySlug = async (slug: string): Promise<Videos | null> => {
  return prisma.videos.findUnique({ where: { slug } });
};

// const create = async (videoData: Omit<Videos, 'id_video' | 'created_at'>): Promise<Videos> => {
//   const { id_user, ...rest } = videoData;
//   const createData: any = { ...rest };

//   if (id_user !== undefined) {
//     createData.user = { connect: { id_user } };
//   } else {
//     throw new Error('User ID is required to create a video');
//   }

//   return prisma.videos.create({ data: createData });
// };

// const update = async (slug: string, data: Partial<Omit<Videos, 'id_video' | 'created_at'>>): Promise<Videos> => {
//   return prisma.videos.update({ where: { slug }, data });
// };

const create = async (videoData: Omit<Videos, 'id_video' | 'created_at'>, transaction?: Prisma.TransactionClient): Promise<Videos> => {
  const { id_user, ...rest } = videoData;
  const createData: any = { ...rest };

  if (id_user !== undefined) {
    createData.user = { connect: { id_user } };
  } else {
    throw new Error('User ID is required to create a video');
  }

  const client = transaction || prisma;
  return client.videos.create({ data: createData });
};

const update = async (slug: string, data: Partial<Omit<Videos, 'id_video' | 'created_at'>>): Promise<Videos> => {
  return prisma.videos.update({ where: { slug }, data });
};

const findAll = async (options?: { orderBy?: { [key: string]: 'asc' | 'desc' } }): Promise<Videos[]> => {
  return prisma.videos.findMany(options);
};

const findByUserEmail = async (email: string) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found');
  }
  return prisma.videos.findMany({
    where: { id_user: user.id_user },
    orderBy: { created_at: 'desc' },
    include: { user: true }
  });
};

const getThumbnailByVideoId = async (videoId: string): Promise<string | null> => {
  const video = await prisma.videos.findUnique({ where: { slug: videoId } });
  return video ? video.thumbnail : null;
};

const deleteBySlug = async (slug: string): Promise<void> => {
  await prisma.videos.delete({ where: { slug } });
};


export default { findBySlug, create, update, findAll, findByUserEmail, getThumbnailByVideoId }; 