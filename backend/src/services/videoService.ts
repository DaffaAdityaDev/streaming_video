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

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);


dotenv.config();

const uploadVideo = async (file: Express.Multer.File, userId: number, io: Server) => {
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
    };

    const video = await videoRepository.create(videoData);

    // Step 2: Process video asynchronously
    processVideo(file, slug, io).then(async (highestQuality) => {
      await videoRepository.update(slug, { quality: highestQuality });
      io.emit('processingComplete', { file: slug });

      // Generate thumbnail after processing
      const defaultQualityPath = path.join(__dirname, '../../video/defaultQuality', `${slug}.mp4`);
      await generateThumbnail(defaultQualityPath, slug);
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
    console.log('Video not found');
  }
  return video;
};

const updateVideoDetails = async (slug: string, title: string, description: string) => {
  const video = await videoRepository.update(slug, { title_video: title, description });
  if (!video) {
    console.log('Video not found');
  }
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
  const videos = await videoRepository.findByUserEmail(email);
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
    console.log('Thumbnail not found');
    return ''; // Return an empty string as a default thumbnail
  }
  return thumbnail;
};

const deleteVideo = async (id: number) => {
  const video = await videoRepository.findById(id);
  if (!video) {
    throw new Error('Video not found');
  }
  await videoRepository.deleteById(id);
};

const deleteVideoById = async (id: number) => {
  const video = await videoRepository.findById(id);
  if (!video) {
    throw new Error('Video not found');
  }
  await videoRepository.deleteById(id);
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

export default { uploadVideo, getVideoBySlug, updateVideoDetails, getAllVideos, getVideosByUserEmail, getThumbnail, deleteVideo, deleteVideoBySlug, deleteVideoById }; 