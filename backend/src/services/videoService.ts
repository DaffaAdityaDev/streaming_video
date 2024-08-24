import videoRepository from '../repository/videoRepository';
import { v4 as uuidv4 } from 'uuid';
import { addVideoProcessingJob, registerSocketServer } from '../jobs/videoProcessingJob';
import { ResolutionConfig } from '../types';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { getThumbnailByVideoId } from '../models/videoModel';

const uploadVideo = async (file: Express.Multer.File, userId: number, io: Server) => {
  if (userId === undefined) {
    throw new Error('User ID is required to upload a video');
  }

  const slug = uuidv4();
  const videoDir = path.join(__dirname, '../../../backend/video/');
  const defaultQualityDir = path.join(videoDir, 'defaultQuality');
  
  if (!fs.existsSync(defaultQualityDir)) {
    fs.mkdirSync(defaultQualityDir, { recursive: true });
  }

  const mp4Path = path.join(defaultQualityDir, `${slug}.mp4`);

  // Convert the uploaded video to MP4 format using GPU acceleration with fallback to CPU
  await new Promise((resolve, reject) => {
    let ffmpegCommand = ffmpeg(file.path)
      .toFormat('mp4')
      .audioCodec('aac')
      .audioBitrate('128k');

    // Try GPU acceleration first
    ffmpegCommand
      .videoCodec('h264_nvenc')
      .outputOptions([
        '-preset slow',
        '-crf 23'
      ])
      .on('start', () => {
        console.log('Started converting video to MP4 using GPU acceleration');
      })
      .on('error', (err) => {
        console.warn('GPU acceleration failed, falling back to CPU encoding:', err);
        
        // Fallback to CPU encoding
        ffmpegCommand
          .videoCodec('libx264')
          .outputOptions([
            '-preset medium',
            '-crf 23'
          ])
          .on('start', () => {
            console.log('Started converting video to MP4 using CPU encoding');
          })
          .on('error', (err) => {
            console.error('Error converting video:', err);
            reject(err);
          })
          .on('end', () => {
            console.log('Video conversion finished');
            resolve(null);
          })
          .save(mp4Path);
      })
      .on('progress', (progress) => {
        console.log(`Processing: ${progress.percent}% done`);
      })
      .on('end', () => {
        console.log('Video conversion finished using GPU acceleration');
        resolve(null);
      })
      .save(mp4Path);
  });

  // Delete the original uploaded file
  fs.unlinkSync(file.path);

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

  const resolutionConfig = {
    '144p': { bitrate: '1000k', width: '256', outputDir: path.join(videoDir, '144p/') },
    '240p': { bitrate: '1500k', width: '426', outputDir: path.join(videoDir, '240p/') },
    '480p': { bitrate: '2500k', width: '854', outputDir: path.join(videoDir, '480p/') },
    '720p': { bitrate: '5000k', width: '1280', outputDir: path.join(videoDir, '720p/') },
    '1080p': { bitrate: '8000k', width: '1920', outputDir: path.join(videoDir, '1080p/') },
    '4k': { bitrate: '35000k', width: '3840', outputDir: path.join(videoDir, '4k/') },
  };

  const socketId = uuidv4();
  registerSocketServer(socketId, io);

  const highestQuality = await addVideoProcessingJob(mp4Path, slug, resolutionConfig, socketId);

  await videoRepository.update(slug, { quality: highestQuality });

  io.emit('processingComplete', { file: slug });

  return video;
};

const getVideoBySlug = async (slug: string) => {
  const video = await videoRepository.findBySlug(slug);
  if (!video) {
    throw new Error('Video not found');
  }
  return video;
};

const updateVideoDetails = async (slug: string, title: string, description: string) => {
  const video = await videoRepository.update(slug, { title_video: title, description });
  if (!video) {
    throw new Error('Video not found');
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
    throw new Error('Thumbnail not found');
  }
  return thumbnail;
};

export default { uploadVideo, getVideoBySlug, updateVideoDetails, getAllVideos, getVideosByUserEmail, getThumbnail };