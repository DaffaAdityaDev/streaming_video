import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import { createLogger } from '../utils/logger';
import { AppError, errorTypes } from '../utils/AppError';
import { Video } from '../models/videoModel';
import videoRepository from '../repository/videoRepository';
import prisma from '../config/database';
import { processVideo, generateThumbnail } from '../utils/videoProcessing';

dotenv.config();

const logger = createLogger('videoService');

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

const VALID_VIDEO_FORMATS = ['.mp4', '.avi', '.mov', '.wmv', '.flv'];
const VIDEO_QUALITIES = ['defaultQuality', '144p', '240p', '480p', '720p', '1080p', '4k'];

const validateVideoFile = async (file: Express.Multer.File) => {
  if (!file || !file.path) {
    throw new AppError('No file uploaded', errorTypes.BAD_REQUEST);
  }

  await fs.access(file.path);

  const stats = await fs.stat(file.path);
  if (stats.size === 0) {
    throw new AppError('File is empty', errorTypes.BAD_REQUEST);
  }

  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!VALID_VIDEO_FORMATS.includes(fileExtension)) {
    throw new AppError('Invalid video format', errorTypes.BAD_REQUEST);
  }
};

const createInitialVideoEntry = async (file: Express.Multer.File, userId: number, slug: string) => {
  const videoData = {
    title_video: file.originalname,
    description: '',
    channel: '',
    slug,
    thumbnail: `${slug}.png`,
    quality: 'defaultQuality',
    views: 0,
    likes: 0,
    id_user: userId,
    status: 'processing'
  };

  return videoRepository.create(videoData);
};

const handleVideoProcessing = async (file: Express.Multer.File, slug: string, io: Server) => {
  try {
    const highestQuality = await processVideo(file, slug, io);
    await videoRepository.update(slug, { quality: highestQuality });
    io.emit('processingComplete', { file: slug });

    const defaultQualityPath = path.join(__dirname, '../../video/defaultQuality', `${slug}.mp4`);
    await generateThumbnail(defaultQualityPath, slug);
  } catch (error) {
    logger.error('Error processing video:', error);
    io.emit('processingError', { file: slug, error: error });
    await videoRepository.update(slug, { quality: 'processing_failed' });
  }
};

const uploadVideo = async (file: Express.Multer.File, userId: number, io: Server) => {
  try {
    await validateVideoFile(file);

    const slug = uuidv4();
    const video = await createInitialVideoEntry(file, userId, slug);

    handleVideoProcessing(file, slug, io);

    return video;
  } catch (error) {
    logger.error('Error in uploadVideo:', error);
    throw error;
  }
};

const getVideoBySlug = async (slug: string) => {
  const video = await videoRepository.findBySlug(slug);
  if (!video) {
    logger.warn('Video not found');
    throw new AppError('Video not found', errorTypes.NOT_FOUND);
  }
  return video;
};

const updateVideo = async (id: number, updateData: Partial<Video>) => {
  const video = await videoRepository.updateVideo(id, updateData);
  if (!video) throw new AppError('Video not found', errorTypes.NOT_FOUND);
  return video;
};

const getAllVideos = async () => videoRepository.findAll({ orderBy: { created_at: 'desc' } });

const getVideosByUserEmail = async (email: string) => {
  logger.info('Fetching videos for email:', email);
  const videos = await videoRepository.findByUserEmail(email);
  logger.info('Videos found:', videos.length);
  
  if (videos.length === 0) {
    logger.info('No videos found for user');
    return [];
  }

  return videos.map(({ id_video, title_video, description, thumbnail, slug }) => 
    ({ id_video, title_video, description, thumbnail, slug }));
};

const getThumbnail = async (videoId: string): Promise<string> => {
  const thumbnail = await videoRepository.getThumbnailByVideoId(videoId);
  if (!thumbnail) {
    logger.warn(`Thumbnail not found for video ID: ${videoId}`);
    return '';
  }
  return thumbnail;
};

const deleteVideoById = async (id: number) => {
  const video = await videoRepository.findById(id);
  if (!video) {
    throw new Error('Video not found');
  }
  await videoRepository.deleteById(id);
  return video;
};

const deleteVideo = async (id: number) => {
  return prisma.$transaction(async (prismaClient) => {
    const video = await prismaClient.videos.findUnique({
      where: { id_video: id },
      include: { comments: true }
    });

    if (!video) {
      throw new Error('Video not found');
    }

    await prismaClient.comments.deleteMany({ where: { id_video: id } });
    await prismaClient.videos.delete({ where: { id_video: id } });

    await deleteVideoFiles(video.slug);
    await deleteThumbnail(video.thumbnail);

    return video;
  });
};

const deleteVideoFiles = async (slug: string) => {
  const videoDir = path.join(__dirname, '../../video');

  for (const quality of VIDEO_QUALITIES) {
    const filePath = path.join(videoDir, quality, `${slug}.mp4`);
    await deleteFile(filePath);
  }
};

const deleteThumbnail = async (thumbnail: string) => {
  const thumbnailPath = path.join(__dirname, '../../thumbnails', thumbnail);
  await deleteFile(thumbnailPath);
};

const deleteFile = async (filePath: string) => {
  try {
    await fs.access(filePath);
    await fs.unlink(filePath);
    logger.info(`Deleted file: ${filePath}`);
  } catch (error) {
    handleFileDeleteError(error, filePath);
  }
};

const handleFileDeleteError = (error: unknown, filePath: string) => {
  if (error instanceof Error && 'code' in error) {
    switch (error.code) {
      case 'ENOENT':
        logger.warn(`File not found: ${filePath}`);
        break;
      case 'EACCES':
        logger.error(`Permission denied: ${filePath}`);
        throw new AppError('Permission denied when deleting file', errorTypes.FORBIDDEN);
      default:
        logger.error(`Failed to delete file: ${filePath}`, error);
    }
  } else {
    logger.error(`Unknown error when deleting file: ${filePath}`, error);
  }
};

const incrementVideoView = async (slug: string) => {
  const video = await videoRepository.incrementViews(slug);
  if (!video) {
    throw new AppError('Video not found', errorTypes.NOT_FOUND);
  }
  return video;
};

const deleteVideoBySlug = async (slug: string) => {
  const video = await videoRepository.findBySlug(slug);
  if (!video) {
    throw new Error('Video not found');
  }
  await videoRepository.deleteBySlug(slug);
  return video;
};

const updateThumbnail = async (slug: string, newThumbnailFileName: string): Promise<Video> => {
  const updatedVideo = await videoRepository.update(slug, { thumbnail: newThumbnailFileName });
  if (!updatedVideo) {
    throw new AppError('Failed to update video thumbnail', errorTypes.INTERNAL_SERVER);
  }
  return updatedVideo;
};

export default { 
  uploadVideo,
  getVideoBySlug,
  getAllVideos, 
  getVideosByUserEmail,
  getThumbnail,
  deleteVideo, 
  deleteVideoBySlug,
  deleteVideoById,
  updateVideo,
  incrementVideoView,
  updateThumbnail
};