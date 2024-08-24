import { generateThumbnail } from '../utils';
import { Server } from 'socket.io';
import { ResolutionConfig, Task } from '../types';
import { MakeVideoQueue } from '../utils';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

const videoQueue = MakeVideoQueue(4);

videoQueue.drain(() => {
  console.log('All video processing jobs have been processed');
});

export const addVideoProcessingJob = (
  filePath: string,
  slug: string,
  resolutionConfig: Record<string, ResolutionConfig>,
  socketId: string
) => {
  return new Promise<string>((resolve, reject) => {
    const io = videoQueue.ioMap.get(socketId);
    if (!io) {
      return reject(new Error(`Socket server not found for socketId: ${socketId}`));
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata) {
        console.error('Error reading video file:', err);
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
        const outputDir = config.outputDir;
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `${slug}.mp4`);

        console.log(`Processing resolution ${res} for video ${slug}`);

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
              error: true
            });
          } else {
            processedVideos++;
            console.log(`Finished processing ${res} for video ${slug}. ${processedVideos}/${totalVideos} completed.`);
            
            io.emit('uploadProgress', {
              file: slug,
              resolution: res,
              progress: 100
            });

            const overallProgress = (processedVideos / totalVideos) * 100;
            io.emit('uploadProgress', {
              file: slug,
              resolution: 'overall',
              progress: overallProgress
            });
            
            if (processedVideos === totalVideos) {
              console.log(`All resolutions processed for video ${slug}. Generating thumbnail.`);
              generateThumbnail(filePath, slug);
              
              io.emit('uploadProgress', {
                file: slug,
                resolution: 'overall',
                progress: 100
              });

              setTimeout(() => {
                resolve(selectedResolution[0]);
              }, 1000);
            }
          }
        });
      }
    });
  });
};

export const registerSocketServer = (socketId: string, io: Server) => {
  videoQueue.ioMap.set(socketId, io);
};

export default videoQueue;