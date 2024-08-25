import { PrismaClient, Videos } from '@prisma/client';

const prisma = new PrismaClient();

export type Video = Videos;

export const findVideoBySlug = async (slug: string): Promise<Video | null> => {
  return prisma.videos.findUnique({ where: { slug } });
};

export const createVideo = async (videoData: Omit<Video, 'id_video' | 'created_at'>): Promise<Video> => {
  return prisma.videos.create({ data: videoData });
};

export const updateVideo = async (slug: string, data: Partial<Omit<Video, 'id_video' | 'created_at'>>): Promise<Video> => {
  return prisma.videos.update({ where: { slug }, data });
};

export const getThumbnailByVideoId = async (videoId: string): Promise<string | null> => {
  const video = await prisma.videos.findUnique({ where: { slug: videoId } });
  return video ? video.thumbnail : null; 
};