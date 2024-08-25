import videoRepository from '../repository/videoRepository';
import { v4 as uuidv4 } from 'uuid';
import { addVideoProcessingJob, registerSocketServer } from '../jobs/videoProcessingJob';
import { ResolutionConfig } from '../types';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { getThumbnailByVideoId } from '../models/videoModel';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import { PrismaClient } from '@prisma/client';

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

const prisma = new PrismaClient();

// const uploadVideo = async (file: Express.Multer.File, userId: number, io: Server) => {
//   if (userId === undefined) {
//     throw new Error('User ID is required to upload a video');
//   }

//   const slug = uuidv4();
//   const videoDir = path.join(__dirname, '../../../backend/video/');
//   const defaultQualityDir = path.join(videoDir, 'defaultQuality');
  
//   if (!fs.existsSync(defaultQualityDir)) {
//     fs.mkdirSync(defaultQualityDir, { recursive: true });
//   }

//   const mp4Path = path.join(defaultQualityDir, `${slug}.mp4`);

//   try {

//     const isMP4 = file.mimetype === 'video/mp4';

//     if (isMP4) {
//       // If it's already MP4, just move the file
//       fs.renameSync(file.path, mp4Path);
//       io.emit('conversionProgress', { file: slug, step: 'skip', message: 'File is already MP4, skipping conversion' });
//     } else {
//     // Convert the uploaded video to MP4 format using GPU acceleration with fallback to CPU
//     await new Promise((resolve, reject) => {
//       let ffmpegCommand = ffmpeg(file.path)
//         .toFormat('mp4')
//         .audioCodec('aac')
//         .audioBitrate('128k');
  
//       // Try GPU acceleration first
//       ffmpegCommand
//         .videoCodec('h264_nvenc')
//         .outputOptions([
//           '-preset slow',
//           '-crf 23'
//         ])
//         .on('start', () => {
//           console.log('Started converting video to MP4 using GPU acceleration');
//           io.emit('conversionProgress', { file: slug, step: 'start', message: 'Started GPU conversion' });
//         })
//         .on('progress', (progress) => {
//           console.log(`GPU Conversion Progress: ${progress.percent}% done`);
//           io.emit('conversionProgress', { file: slug, step: 'progress', progress: progress.percent });
//         })
//         .on('error', (err) => {
//           console.warn('GPU acceleration failed, falling back to CPU encoding:', err);
//           io.emit('conversionProgress', { file: slug, step: 'fallback', message: 'Falling back to CPU encoding' });
          
//           // Fallback to CPU encoding
//           ffmpegCommand
//             .videoCodec('libx264')
//             .outputOptions([
//               '-preset medium',
//               '-crf 23'
//             ])
//             .on('start', () => {
//               console.log('Started converting video to MP4 using CPU encoding');
//               io.emit('conversionProgress', { file: slug, step: 'start', message: 'Started CPU conversion' });
//             })
//             .on('progress', (progress) => {
//               console.log(`CPU Conversion Progress: ${progress.percent}% done`);
//               io.emit('conversionProgress', { file: slug, step: 'progress', progress: progress.percent });
//             })
//             .on('error', (err) => {
//               console.error('Error converting video:', err);
//               io.emit('conversionProgress', { file: slug, step: 'error', message: 'Error converting video' });
//               reject(err);
//             })
//             .on('end', () => {
//               console.log('Video conversion finished');
//               io.emit('conversionProgress', { file: slug, step: 'end', message: 'Video conversion finished' });
//               resolve(null);
//             })
//             .save(mp4Path);
//         })
//         .on('end', () => {
//           console.log('Video conversion finished using GPU acceleration');
//           io.emit('conversionProgress', { file: slug, step: 'end', message: 'Video conversion finished' });
//           resolve(null);
//         })
//         .save(mp4Path);
//     });
//   }

//    // Delete the original uploaded file if it wasn't moved
//    if (!isMP4 && fs.existsSync(file.path)) {
//     fs.unlinkSync(file.path);
// } 

//     const videoData = {
//       title_video: file.originalname,
//       description: '',
//       channel: '',
//       slug,
//       thumbnail: `${slug}.png`,
//       quality: 'defaultQuality',
//       views: 0,
//       likes: 0,
//       id_user: userId,
//     };

//     const video = await videoRepository.create(videoData);

//     const resolutionConfig = {
//       '144p': { bitrate: '1000k', width: '256', outputDir: path.join(videoDir, '144p/') },
//       '240p': { bitrate: '1500k', width: '426', outputDir: path.join(videoDir, '240p/') },
//       '480p': { bitrate: '2500k', width: '854', outputDir: path.join(videoDir, '480p/') },
//       '720p': { bitrate: '5000k', width: '1280', outputDir: path.join(videoDir, '720p/') },
//       '1080p': { bitrate: '8000k', width: '1920', outputDir: path.join(videoDir, '1080p/') },
//       '4k': { bitrate: '35000k', width: '3840', outputDir: path.join(videoDir, '4k/') },
//     };

//     const socketId = uuidv4();
//     registerSocketServer(socketId, io);


//     const highestQuality = await addVideoProcessingJob(mp4Path, slug, resolutionConfig, socketId);

//     await videoRepository.update(slug, { quality: highestQuality });

//     io.emit('processingComplete', { file: slug });

//     return video;
//   } catch (error) {
//     console.error('Error in uploadVideo:', error);
//     throw error;
//   }
// };

const uploadVideo = async (file: Express.Multer.File, userId: number, io: Server) => {
  const slug = uuidv4();
  const videoDir = path.join(__dirname, '../../../backend/video/');
  const defaultQualityDir = path.join(videoDir, 'defaultQuality');
  
  if (!fs.existsSync(defaultQualityDir)) {
    await fs.promises.mkdir(defaultQualityDir, { recursive: true });
  }

  const mp4Path = path.join(defaultQualityDir, `${slug}.mp4`);

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
    processVideoAsync(file, mp4Path, slug, io).then(async (highestQuality) => {
      await videoRepository.update(slug, { quality: highestQuality });
      io.emit('processingComplete', { file: slug });
    }).catch(async (error) => {
      console.error('Error processing video:', error);
      io.emit('processingError', { file: slug, error: error.message });
      
      // Update the video entry to indicate processing failure
      await videoRepository.update(slug, { quality: 'processing_failed' });
      
      // Optionally, delete the original file if processing failed
      if (fs.existsSync(mp4Path)) {
        fs.unlinkSync(mp4Path);
      }
    });

    return video;
  } catch (error) {
    console.error('Error in uploadVideo:', error);
    throw error;
  }
};

const processVideoAsync = async (file: Express.Multer.File, mp4Path: string, slug: string, io: Server): Promise<string> => {
  const isMP4 = file.mimetype === 'video/mp4';
  const videoDir = path.join(__dirname, '../../video');
  const defaultQualityDir = path.join(videoDir, 'defaultQuality');
  const inputPath = path.join(defaultQualityDir, `${slug}.mp4`);

  try {
    if (isMP4) {
      await fs.promises.copyFile(file.path, mp4Path);
      io.emit('conversionProgress', { file: slug, step: 'skip', message: 'File is already MP4, skipping conversion' });
    } else {
      await convertToMp4(file.path, mp4Path, slug, io);
    }

    // Delete the original uploaded file
    if (fs.existsSync(file.path)) {
      await fs.promises.unlink(file.path);
    }

    // const videoDir = path.join(__dirname, '../../video');
    const resolutionConfig = {
      '144p': { bitrate: '1000k', width: '256', outputDir: path.join(videoDir, '144p') },
      '240p': { bitrate: '1500k', width: '426', outputDir: path.join(videoDir, '240p') },
      '480p': { bitrate: '2500k', width: '854', outputDir: path.join(videoDir, '480p') },
      '720p': { bitrate: '5000k', width: '1280', outputDir: path.join(videoDir, '720p') },
      '1080p': { bitrate: '8000k', width: '1920', outputDir: path.join(videoDir, '1080p') },
      '4k': { bitrate: '35000k', width: '3840', outputDir: path.join(videoDir, '4k') },
    };

    // Create resolution directories
    for (const config of Object.values(resolutionConfig)) {
      await fs.promises.mkdir(config.outputDir, { recursive: true });
    }

    const socketId = uuidv4();
    registerSocketServer(socketId, io);

    return addVideoProcessingJob(mp4Path, slug, resolutionConfig, socketId);
  } catch (error) {
    console.error('Error in processVideoAsync:', error);
    throw error;
  }
};

const convertToMp4 = (inputPath: string, outputPath: string, slug: string, io: Server): Promise<void> => {
  return new Promise((resolve, reject) => {
    const runConversion = (useGPU: boolean) => {
      let ffmpegCommand = ffmpeg(inputPath)
        .toFormat('mp4')
        .audioCodec('aac')
        .audioBitrate('128k');

      if (useGPU) {
        ffmpegCommand.videoCodec('h264_nvenc').outputOptions(['-preset slow', '-crf 23']);
      } else {
        ffmpegCommand.videoCodec('libx264').outputOptions(['-preset medium', '-crf 23']);
      }

      ffmpegCommand
        .on('start', () => {
          console.log(`Started converting video to MP4 using ${useGPU ? 'GPU' : 'CPU'} encoding`);
          io.emit('conversionProgress', { file: slug, step: 'start', message: `Started ${useGPU ? 'GPU' : 'CPU'} conversion` });
        })
        .on('progress', (progress) => {
          console.log(`${useGPU ? 'GPU' : 'CPU'} Conversion Progress: ${progress.percent}% done`);
          io.emit('conversionProgress', { file: slug, step: 'progress', progress: progress.percent });
        })
        .on('error', (err) => {
          if (useGPU) {
            console.warn('GPU acceleration failed, falling back to CPU encoding:', err);
            io.emit('conversionProgress', { file: slug, step: 'fallback', message: 'Falling back to CPU encoding' });
            runConversion(false);
          } else {
            console.error('Error converting video:', err);
            io.emit('conversionProgress', { file: slug, step: 'error', message: 'Error converting video' });
            reject(err);
          }
        })
        .on('end', () => {
          console.log(`Video conversion finished using ${useGPU ? 'GPU' : 'CPU'} encoding`);
          io.emit('conversionProgress', { file: slug, step: 'end', message: 'Video conversion finished' });
          resolve();
        })
        .save(outputPath);
    };

    runConversion(true); // Start with GPU encoding attempt
  });
};
// const convertToMp4 = (inputPath: string, outputPath: string, slug: string, io: Server): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     let ffmpegCommand = ffmpeg(inputPath)
//       .toFormat('mp4')
//       .audioCodec('aac')
//       .audioBitrate('128k');

//     ffmpegCommand
//       .videoCodec('h264_nvenc')
//       .outputOptions(['-preset slow', '-crf 23'])
//       .on('start', () => {
//         console.log('Started converting video to MP4 using GPU acceleration');
//         io.emit('conversionProgress', { file: slug, step: 'start', message: 'Started GPU conversion' });
//       })
//       .on('progress', (progress) => {
//         console.log(`GPU Conversion Progress: ${progress.percent}% done`);
//         io.emit('conversionProgress', { file: slug, step: 'progress', progress: progress.percent });
//       })
//       .on('error', (err) => {
//         console.warn('GPU acceleration failed, falling back to CPU encoding:', err);
//         io.emit('conversionProgress', { file: slug, step: 'fallback', message: 'Falling back to CPU encoding' });
        
//         ffmpegCommand
//           .videoCodec('libx264')
//           .outputOptions(['-preset medium', '-crf 23'])
//           .on('start', () => {
//             console.log('Started converting video to MP4 using CPU encoding');
//             io.emit('conversionProgress', { file: slug, step: 'start', message: 'Started CPU conversion' });
//           })
//           .on('progress', (progress) => {
//             console.log(`CPU Conversion Progress: ${progress.percent}% done`);
//             io.emit('conversionProgress', { file: slug, step: 'progress', progress: progress.percent });
//           })
//           .on('error', (err) => {
//             console.error('Error converting video:', err);
//             io.emit('conversionProgress', { file: slug, step: 'error', message: 'Error converting video' });
//             reject(err);
//           })
//           .on('end', () => {
//             console.log('Video conversion finished');
//             io.emit('conversionProgress', { file: slug, step: 'end', message: 'Video conversion finished' });
//             resolve();
//           })
//           .save(outputPath);
//       })
//       .on('end', () => {
//         console.log('Video conversion finished using GPU acceleration');
//         io.emit('conversionProgress', { file: slug, step: 'end', message: 'Video conversion finished' });
//         resolve();
//       })
//       .save(outputPath);
//   });
// };

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