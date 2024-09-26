import async from 'async';
import { Server } from 'socket.io';
import ffmpeg from 'fluent-ffmpeg';
import { Task, ResolutionConfig } from '../types';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const concurrency = parseInt(process.env.MAX_VIDEO_PROCESSING_QUEUE || '2'); // Adjust based on your server's capacity

interface CustomQueue extends async.QueueObject<Task> {
  ioMap: Map<string, Server>;
}

const videoQueue: CustomQueue = async.queue((task: Task, callback) => {
  const { filePath, resolutionConfig, outputPath, res, io, uniqueId } = task;

  let ffmpegCommand = ffmpeg(filePath)
    .toFormat('mp4')
    .audioCodec('aac')
    .audioBitrate('128k'); 

  const useGPU = process.env.USE_GPU_ENCODING === 'true';

  if (useGPU) {
    ffmpegCommand.videoCodec('h264_nvenc').outputOptions(['-preset slow', '-crf 23']);
  } else {
    ffmpegCommand.videoCodec('libx264').outputOptions(['-preset medium', '-crf 23']);
  }

  ffmpegCommand
    .size(`${resolutionConfig.width}x?`)
    .videoBitrate(resolutionConfig.bitrate)
    .on('start', () => {
      console.log(`[${res}] Started converting video`);
      io.emit('conversionProgress', { file: uniqueId, resolution: res, step: 'start', message: `Started ${res} conversion` });
    })
    .on('progress', (progress) => {
      console.log(`[${res}] Conversion Progress: ${progress.percent}% done`);
      io.emit('conversionProgress', { file: uniqueId, resolution: res, step: 'progress', progress: progress.percent });
    })
    .on('error', (err) => {
      console.error(`[${res}] Error converting video:`, err);
      io.emit('conversionProgress', { file: uniqueId, resolution: res, step: 'error', message: 'Error converting video' });
      callback(err);
    })
    .on('end', () => {
      console.log(`[${res}] Conversion finished`);
      io.emit('conversionProgress', { file: uniqueId, resolution: res, step: 'end', message: 'Video conversion finished' });
      callback();
    })
    .save(outputPath);
}, concurrency) as CustomQueue;

videoQueue.ioMap = new Map<string, Server>();

export const processVideo = async (file: Express.Multer.File, slug: string, io: Server): Promise<string> => {
  const videoDir = path.join(__dirname, '../../video');
  const defaultQualityDir = path.join(videoDir, 'defaultQuality');
  const inputPath = path.join(defaultQualityDir, `${slug}.mp4`);

  try {
    await fs.promises.mkdir(defaultQualityDir, { recursive: true });

    // Emit initial conversion event
    io.emit('conversionProgress', { file: slug, step: 'start', message: 'Starting conversion' });

    if (file.mimetype !== 'video/mp4') {
      await convertToMp4(file.path, inputPath, slug, io);
    } else {
      await fs.promises.copyFile(file.path, inputPath);
      io.emit('conversionProgress', { file: slug, step: 'skip', message: 'File is already MP4, skipping conversion' });
    }

    // Emit upload name event
    io.emit('uploadProgress', { file: slug, resolution: 'upload', progress: 100 });

    // Emit initial overall progress event
    io.emit('uploadProgress', { file: slug, resolution: 'overall', progress: 0 });

    // Delete the original uploaded file
    if (fs.existsSync(file.path)) {
      await fs.promises.unlink(file.path);
    }

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
    videoQueue.ioMap.set(socketId, io);

    return addVideoProcessingJob(inputPath, slug, resolutionConfig, socketId);
  } catch (error) {
    console.error('Error in processVideo:', error);
    io.emit('processingError', { file: slug, error: (error as Error).message });
    throw error;
  }
};

const convertToMp4 = (inputPath: string, outputPath: string, slug: string, io: Server): Promise<void> => {
  return new Promise((resolve, reject) => {
    const useGPU = process.env.USE_GPU_ENCODING === 'true';
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

    runConversion(useGPU); // Start with GPU encoding attempt
  });
};

const addVideoProcessingJob = (
  filePath: string,
  slug: string,
  resolutionConfig: Record<string, ResolutionConfig>,
  socketId: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const io = videoQueue.ioMap.get(socketId);
    if (!io) {
      return reject(new Error(`Socket server not found for socketId: ${socketId}`));
    }

    ffmpeg.ffprobe(filePath, async (err, metadata) => {
      if (err || !metadata) {
        console.error('Error reading video file:', err);
        io.emit('uploadProgress', {
          file: slug,
          resolution: 'overall',
          progress: 100,
          error: true,
          message: 'Error reading video file'
        });
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        reject(new Error('No video stream found in file'));
        return;
      }

      const videoWidth = videoStream.width;
      const sortedResolutions = Object.entries(resolutionConfig).sort((a, b) => 
        parseInt(a[1].width) - parseInt(b[1].width)
      );

      let selectedResolution = sortedResolutions[sortedResolutions.length - 1];
      for (const [res, config] of sortedResolutions) {
        if (videoWidth && videoWidth <= parseInt(config.width)) {
          selectedResolution = [res, config];
          break;
        }
      }

      const selectedResolutionIndex = sortedResolutions.findIndex(([res]) => res === selectedResolution[0]);
      const totalVideos = selectedResolutionIndex + 1;
      let processedVideos = 0;

      console.log(`Starting to process ${totalVideos} resolutions for video ${slug}`);

      for (let i = selectedResolutionIndex; i >= 0; i--) {
        const [res, config] = sortedResolutions[i];
        const outputPath = path.join(config.outputDir, `${slug}.mp4`);

        const task: Task = {
          filePath,
          resolutionConfig: config, 
          outputPath,
          res,
          io,
          totalVideos,
          processedVideos,
          uniqueId: slug,
        };

        videoQueue.push(task, (err) => {
          if (err) {
            console.error(`Error processing video for ${res}:`, err);
            io.emit('uploadProgress', {
              file: slug,
              resolution: res,
              progress: 100,
              error: true,
              message: `Error processing ${res} resolution`
            });
          } else {
            processedVideos++;
            console.log(`Finished processing ${res} for video ${slug}. ${processedVideos}/${totalVideos} completed.`);
            
            io.emit('uploadProgress', {
              file: slug,
              resolution: res,
              progress: 100
            });
          }
        
          const overallProgress = (processedVideos / totalVideos) * 100;
          io.emit('uploadProgress', {
            file: slug,
            resolution: 'overall',
            progress: overallProgress
          });
          
          if (processedVideos === totalVideos) {
            console.log(`All resolutions processed for video ${slug}.`);
            
            io.emit('uploadProgress', {
              file: slug,
              resolution: 'overall',
              progress: 100
            });
        
            setTimeout(() => {
              resolve(selectedResolution[0]);
            }, 1000);
          }
        });
      }
    });
  });
};

export const generateThumbnail = (videoPath: string, uniqueId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    console.log('Generating thumbnail for', videoPath);
    const thumbnailPath = path.join(__dirname, '../../thumbnails');

    if (!fs.existsSync(thumbnailPath)) {
      fs.mkdirSync(thumbnailPath, { recursive: true });
    }

    const thumbnailName = `${uniqueId}.png`;

    ffmpeg(videoPath)
      .screenshots({
        timestamps: [1],
        filename: thumbnailName,
        folder: thumbnailPath,
        size: '320x240',
      })
      .on('error', function (err) {
        console.error('Error generating thumbnail:', err);
        reject(err);
      })
      .on('end', function () {
        console.log('Thumbnail generated');
        console.log('Thumbnail path:', path.join(thumbnailPath, thumbnailName));
        resolve();
      });
  });
};

export default videoQueue;