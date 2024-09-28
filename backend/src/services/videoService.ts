import videoRepository from '../repository/videoRepository';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import dotenv from 'dotenv';
import { processVideo, generateThumbnail } from '../utils/videoProcessing';
import prisma from '../config/database';
import fs from 'fs/promises';
import fsSync from 'fs';
import { createLogger } from '../utils/logger';
import { AppError, errorTypes } from '../utils/AppError';
import { Video } from '../models/videoModel';

const logger = createLogger('videoService');

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

dotenv.config();

const uploadVideo = async (file: Express.Multer.File, userId: number, io: Server) => {
  if (!file || !file.path) {
    throw new AppError('No file uploaded', errorTypes.BAD_REQUEST);
  }

  try {
    await fs.access(file.path);
  } catch (error) {
    throw new AppError('File is inaccessible', errorTypes.BAD_REQUEST);
  }

  const stats = await fs.stat(file.path);
  if (stats.size === 0) {
    throw new AppError('File is empty', errorTypes.BAD_REQUEST);
  }

  // Check if the file is a valid video format
  const validVideoFormats = ['.mp4', '.avi', '.mov', '.wmv', '.flv'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (!validVideoFormats.includes(fileExtension)) {
    throw new AppError('Invalid video format', errorTypes.BAD_REQUEST);
  }

  const slug = uuidv4();

  try {
    // Step 1: Create initial video entry
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

    const video = await videoRepository.create(videoData);

    // Step 2: Process video asynchronously
    processVideo(file, slug, io).then(async (highestQuality) => {
      await videoRepository.update(slug, { quality: highestQuality });
      io.emit('processingComplete', { file: slug });

      // Generate thumbnail after processing
      const defaultQualityPath = path.join(__dirname, '../../video/defaultQuality', `${slug}.mp4`);
      try {
        await fs.access(defaultQualityPath);
        await generateThumbnail(defaultQualityPath, slug);
      } catch (error) {
        logger.error('Error generating thumbnail:', error);
        io.emit('thumbnailError', { file: slug, error: 'Failed to generate thumbnail' });
      }
    }).catch(async (error) => {
      console.error('Error processing video:', error);
      io.emit('processingError', { file: slug, error: error.message });
      
      // Update the video entry to indicate processing failure
      await videoRepository.update(slug, { quality: 'processing_failed' });
    });

    return video;
  } catch (error) {
    console.error('Error in uploadVideo:', error);
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
const getAllVideos = async () => { 
  return videoRepository.findAll({
    orderBy: {
      created_at: 'desc'
    }
  });
};

const getVideosByUserEmail = async (email: string) => {
  logger.info('Fetching videos for email:', email);
  const videos = await videoRepository.findByUserEmail(email);
  logger.info('Videos found:', videos.length);
  if (videos.length === 0) {
    logger.info('No videos found for user');
    return [];
  }
  return videos.map(video => ({
    id_video: video.id_video,
    title_video: video.title_video,
    description: video.description,
    thumbnail: video.thumbnail,
    slug: video.slug
  }));
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
    // 1. Get the video details
    const video = await prismaClient.videos.findUnique({
      where: { id_video: id },
      include: { comments: true }
    });

    if (!video) {
      throw new Error('Video not found');
    }

    // 2. Delete associated comments
    await prismaClient.comments.deleteMany({
      where: { id_video: id }
    });

    // 3. Delete the video entry from the database
    await prismaClient.videos.delete({
      where: { id_video: id }
    });

    // 4. Delete video files
    const videoDir = path.join(__dirname, '../../video');
    const qualities = ['defaultQuality', '144p', '240p', '480p', '720p', '1080p', '4k'];

    for (const quality of qualities) {
      const filePath = path.join(videoDir, quality, `${video.slug}.mp4`);
      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        logger.info(`Deleted video file: ${filePath}`);
      } catch (error) {
        if (error instanceof Error) {
          if ('code' in error) {
            if (error.code === 'ENOENT') {
              logger.warn(`File not found: ${filePath}`);
            } else if (error.code === 'EACCES') {
              logger.error(`Permission denied: ${filePath}`);
              throw new AppError('Permission denied when deleting video files', errorTypes.FORBIDDEN);
            } else {
              logger.error(`Failed to delete file: ${filePath}`, error);
            }
          } else {
            logger.error(`Unknown error when deleting file: ${filePath}`, error);
          }
        } else {
          logger.error(`Non-Error object thrown when deleting file: ${filePath}`, error);
        }
      }
    }

    // 5. Delete thumbnail
    const thumbnailPath = path.join(__dirname, '../../thumbnails', video.thumbnail);
    try {
      await fs.access(thumbnailPath);
      await fs.unlink(thumbnailPath);
      logger.info(`Deleted thumbnail: ${thumbnailPath}`);
    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error) {
          if (error.code === 'ENOENT') {
            logger.warn(`Thumbnail not found: ${thumbnailPath}`);
          } else if (error.code === 'EACCES') {
            logger.error(`Permission denied: ${thumbnailPath}`);
            throw new AppError('Permission denied when deleting thumbnail', errorTypes.FORBIDDEN);
          } else {
            logger.error(`Failed to delete thumbnail: ${thumbnailPath}`, error);
          }
        } else {
          logger.error(`Unknown error when deleting thumbnail: ${thumbnailPath}`, error);
        }
      } else {
        logger.error(`Non-Error object thrown when deleting thumbnail: ${thumbnailPath}`, error);
      }
    }

    return video;
  });
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
  uploadVideo, getVideoBySlug, getAllVideos, 
  getVideosByUserEmail, getThumbnail, deleteVideo, 
  deleteVideoBySlug, deleteVideoById, updateVideo,
  incrementVideoView, updateThumbnail
 }; 