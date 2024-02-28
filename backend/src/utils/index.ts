import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { Task } from '../types';
import async from 'async';
import { v4 as uuidv4 } from 'uuid';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export function promisify(fn: Function) {
  return (...args: any[]) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err: Error, result: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  };
}

export function generateThumbnail(videoPath: string, uniqueId: string) {
  console.log('Generating thumbnail for', videoPath);
  const thumbnailPath = path.join(__dirname, '../../thumbnails');

  // Create the thumbnails directory if it does not exist
  if (!fs.existsSync(thumbnailPath)) {
    fs.mkdirSync(thumbnailPath, { recursive: true });
  }

  // Extract the video name and append '-thumbnail' to it
  // const videoName = path.basename(videoPath, path.extname(videoPath));
  const thumbnailName = `${uniqueId}.png`;

  ffmpeg(videoPath)
    .screenshots({
      timestamps: [1], // take screenshot at 10 seconds
      filename: thumbnailName,
      folder: thumbnailPath,
      size: '320x240'
    }).on('progress', function(progress) {
      console.log('Processing: ' + progress.percent + '% done');
    })
    .on('error', function(err) {
      console.error('Error generating thumbnail:', err);
    })
    .on('end', function() {
      console.log('Thumbnail generated');
      console.log('Thumbnail path:', path.join(thumbnailPath, thumbnailName));
    });
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await promisify(fs.access)(filePath);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to stream a video file
export async function streamVideoFile(req: Request, res: Response, slug: string | ParsedQs | string[] | ParsedQs[]): Promise<void> {
  const slugStr = typeof slug === 'string' ? slug : Array.isArray(slug) ? slug[0] : '';
  const videoPath = path.join(__dirname, `../../video/${slugStr}.mp4`);

  console.log('Streaming video:', videoPath);
  console.log(__dirname)

  if (!await fileExists(videoPath)) {
    const statusCode = 404;
    res.status(statusCode).send('Video not found');
    return;
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let start, end, contentLength;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    start = parseInt(parts[0],  10);
    end = parts[1] ? parseInt(parts[1],  10) : fileSize -  1;
    contentLength = end - start +  1;
  } else {
    start =  0;
    end = fileSize -  1;
    contentLength = fileSize;
  }

  console.log(contentLength, start, end, fileSize)

  const headers = {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': contentLength,
    'Content-Type': 'video/mp4',
  };

  res.writeHead(range ?  206 :  200, headers);

  const readStream = fs.createReadStream(videoPath, { start, end });

  readStream.on('data', (chunk) => {
    // res.write(chunk);
    console.log('chunk', chunk);
  })

  readStream.on('end', () => {
    console.log('stream end');
    res.end();
  })

  readStream.on('error', (err) => {
    console.error('An error occurred:', err);
    res.status(500).send('Server error');
  });

  readStream.pipe(res);
}

// Create a queue object with concurrency
export const MakeVideoQueue = (concurrency: number) => async.queue((task: Task, callback) => {
  ffmpeg(task.filePath)
    .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
    .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
    .format('mp4')
    .outputOptions('-vf', `scale=${task.resolutionConfig.width}:-1`) // Set the width and calculate the height
    .outputOptions('-b:v', task.resolutionConfig.bitrate) // Set the video bitrate
    .output(task.outputPath)
    .on('start', function(commandLine) {
      console.log(`[${task.res}] Spawned Ffmpeg with command: ${commandLine}`);
    })
    .on('error', function(err, stdout, stderr) {
      console.log(`[${task.res}] Error: ${err.message}`);
      console.log(`[${task.res}] ffmpeg stdout: ${stdout}`);
      console.log(`[${task.res}] ffmpeg stderr: ${stderr}`);
      callback(); // Call the callback function once the task is done
    })
    .on('progress', function(progress) {
      if (progress.percent) {
        // Calculate the overall progress
        const overallProgress = (task.processedVideos / task.totalVideos) * 100 + (progress.percent / task.totalVideos);
        // Emit progress update to the client
        task.io.emit('uploadProgress', {
          file: task.uniqueId,
          resolution: task.res,
          progress: overallProgress.toFixed(2),
        });
      }
    })
    .on('end', function() {
      console.log(`[${task.res}] Conversion Done`);
      task.io.emit('uploadProgress', {
        file: task.uniqueId,
        resolution: task.res,
        progress: 100,
      });
      callback(); // Call the callback function once the task is done
    })
    .run();
}, concurrency);


export async function handleFileUpload(req: Request, res: Response, VideoQueue: async.AsyncQueue<Task>, io: Server) {
  // req.file is the `video` file
  // req.body will hold the text fields, if there were any
  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }

  const { path: filePath, filename } = req.file;

  if (!fs.existsSync(filePath)) {
    // If the file doesn't exist, handle the error
    // For example, you can send a response to the client
    res.status(404).send('Video file not found');
    // Or you can create the file
    // fs.writeFileSync(filePath, '');
    return;
  }

  // Define the output directories for each resolution
  function makeResoltuionConfig(
    resolution: string[],
    bitrate: string[],
    width: string[],
    outputDir: string[]
  ): Record<string, { bitrate: string; width: string; outputDir: string }> {  
    let dataObject: Record<string, { bitrate: string; width: string; outputDir: string }> = {};
    for (let i =  0; i < resolution.length; i++) {
      dataObject[resolution[i]] = {
        bitrate: bitrate[i],
        width: width[i],
        outputDir: outputDir[i]
      };
    }
    return dataObject;
  }

  const videoDir = path.join(__dirname, '../../video/');
  const resolutionConfig = makeResoltuionConfig(
    ['144p', '240p', '480p', '720p', '1080p', '4k'],
    ['1000k', '1500k', '2500k', '5000k', '8000k', '35000k'],
    ['256', '426', '854', '1280', '1920', '3840'],
    [
      path.join(videoDir, '144p/'),
      path.join(videoDir, '240p/'),
      path.join(videoDir, '480p/'),
      path.join(videoDir, '720p/'),
      path.join(videoDir, '1080p/'),
      path.join(videoDir, '4k/')
    ]
  );

  const uniqueId = uuidv4();
  
  ffmpeg.ffprobe(filePath, function(err, metadata) {
    
    if (err || !metadata) {
      console.error('Error reading video file:', err);
      return;
    }
  
    const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
  
    if (videoStream) {
      const videoWidth = videoStream.width;

      // Sort the resolutions from lowest to highest
      const sortedResolutions = Object.entries(resolutionConfig).sort((a, b) => {
        const widthA = parseInt(a[1].width);
        const widthB = parseInt(b[1].width);
        return widthA - widthB;
      });

      // Now you can use the resolution to select the correct output directory and frame size
      let selectedResolution: [string, any] = ['', {}];
      for (const [res, config] of sortedResolutions) {
        const frameWidth = parseInt(config.width);
        if (videoWidth && videoWidth <= frameWidth) {
          selectedResolution = [res, config.outputDir];
          break; // Exit the loop after finding the first matching resolution
        }
      }

      if (!selectedResolution) {
        selectedResolution = [sortedResolutions[sortedResolutions.length - 1][0], sortedResolutions[sortedResolutions.length - 1][1].outputDir]; // Select the highest available resolution if none matched
      }

      // const [res, outputDir] = selectedResolution;
      const selectedResolutionIndex = sortedResolutions.findIndex(([res]) => res === selectedResolution[0]);
      
      const totalVideos = selectedResolutionIndex +   1; // Total number of videos to be processed
      let processedVideos =   0; // Counter for processed videos

      for (let i = selectedResolutionIndex; i >= 0; i--) {
        const [res, config] = sortedResolutions[i];
        const outputDir = config.outputDir;
        fs.mkdirSync(outputDir, { recursive: true }); // Create the directory if it does not exist
        const outputFilename = `${uniqueId}.mp4`;
        const outputPath = path.join(outputDir, outputFilename);

        // Add the task to the queue
        VideoQueue.push({
          filePath,
          resolutionConfig: config,
          outputPath,
          res,
          io,
          totalVideos,
          processedVideos,
          uniqueId,
        });
      }
    } else {
      console.error('No video stream found in file');
    }
  });

  
  const videoPath = req.file.path;
  generateThumbnail(videoPath, uniqueId);

  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }
  const file = req.file;

  // GMT+7
  const currentTime = new Date();
  const timeGMT7 = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
  const timeUpload = new Date(currentTime.getTime() + timeGMT7).toISOString();

  // thumbnail video
  const thumbnailFilename = `${uniqueId}.png`; // Update thumbnail filename
  const thumbnailPath = path.join(__dirname, `../../thumbnails/${thumbnailFilename}`);

  const data = {
    // id: 0, // You'll need to generate or fetch this
    title: file.originalname,
    channel: 'test', // You'll need to generate or fetch this
    img: thumbnailFilename, // You'll need to generate or fetch this
    slug: uniqueId,
    quality: '1080p', // You'll need to generate or fetch this
    duration: 100000, // You'll need to generate or fetch this
    view: 0, // You'll need to generate or fetch this
    likes: 0, // You'll need to generate or fetch this
    timeUpload: timeUpload,
    filename: file.filename,
    path: file.path,
    size: file.size
  };

  fs.writeFileSync('data.txt', JSON.stringify(data));

  let checkIfUser1 = await prisma.users.findFirst({
    where: {
      id_user: 1,
    },
  });

  if (!checkIfUser1) {
    await prisma.users.create({
      data: {
        username: 'admin',
        email: 'admin@gmail.com',
        password: 'admin',
        image_url: 'https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif',
      },
    });
  }

  await prisma.videos.create({
    data: {
      title_video: data.title,
      description: data.channel,
      channel: data.channel,
      thumbnail: data.img,
      slug: data.slug,
      quality: data.quality,
      views: data.view,
      likes: data.likes,
      created_at: data.timeUpload,
      id_user: 1,
    },
  });

  res.status(200).json({
    status: 'success',
    message: 'Video created successfully',
    data,
  });
}

export async function handleTitleAndDescVideo(req: Request, res: Response, data: any) {
  const { title, description, slug } = req.body;

  console.log('title', title, 'description', description, 'slug');
  // res.status(200).send('OK');

  try {
    const pushVideo = await prisma.videos.update({
      where: {
        slug: slug,
        },
        data: {
          title_video: title,
          description: description,
        },
      }
    )

    res.status(200).json({
      status: 'success',
      message: 'Video created successfully',
      data: pushVideo,
    });
  } catch (error) {
    res.status(200).json({
      status: 'error',
      message: error,
    });
  }
}