import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { Task } from '../types';
import async from 'async';

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

export function generateThumbnail(videoPath: string) {
  console.log('Generating thumbnail for', videoPath);
  const thumbnailPath = path.join(__dirname, '../../thumbnails');

  // Create the thumbnails directory if it does not exist
  if (!fs.existsSync(thumbnailPath)) {
    fs.mkdirSync(thumbnailPath, { recursive: true });
  }

  // Extract the video name and append '-thumbnail' to it
  const videoName = path.basename(videoPath, path.extname(videoPath));
  const thumbnailName = `${videoName}-thumbnail.png`;

  ffmpeg(videoPath)
    .screenshots({
      timestamps: [10], // take screenshot at 10 seconds
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

// Create a queue object with concurrency 4
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
        console.log(`[${task.res}] Processing: ${progress.percent.toFixed(2)}% done`);
      }
    })
    .on('end', function() {
      console.log(`[${task.res}] Conversion Done`);
      callback(); // Call the callback function once the task is done
    })
    .run();
}, concurrency);


export async function handleFileUpload(req: Request, res: Response, VideoQueue: async.AsyncQueue<Task>) {
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
  
  // const resolutionConfig = {
  //   '144p': {
  //     width: '256',
  //     outputDir: path.join(__dirname, '../video/144p/'),
  //     bitrate: '1000k'
  //   },
  //   '240p': {
  //     width: '426',
  //     outputDir: path.join(__dirname, '../video/240p/'),
  //     bitrate: '1500k'
  //   },
  //   '480p': {
  //     width: '854',
  //     outputDir: path.join(__dirname, '../video/480p/'),
  //     bitrate: '2500k'
  //   },
  //   '720p': {
  //     width: '1280',
  //     outputDir: path.join(__dirname, '../video/720p/'),
  //     bitrate: '5000k'
  //   },
  //   '1080p': {
  //     width: '1920',
  //     outputDir: path.join(__dirname, '../video/1080p/'),
  //     bitrate: '8000k'
  //   },
  //   '4k': {
  //     width: '3840',
  //     outputDir: path.join(__dirname, '../video/4k/'),
  //     bitrate: '35000k'
  //   },
  //   // Add other resolutions as needed
  // };
  
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

      const [res, outputDir] = selectedResolution;
      const selectedResolutionIndex = sortedResolutions.findIndex(([res]) => res === selectedResolution[0]);

    
      for (let i = selectedResolutionIndex; i >= 0; i--) {
        const [res, config] = sortedResolutions[i];
        const outputDir = config.outputDir;
        fs.mkdirSync(outputDir, { recursive: true }); // Create the directory if it does not exist
        const outputFilename = `${path.basename(filePath, path.extname(filePath))}-${res}.mp4`;
        const outputPath = path.join(outputDir, outputFilename);

        // Add the task to the queue
        VideoQueue.push({
          filePath,
          resolutionConfig: config,
          outputPath,
          res
        });
        // ffmpeg(filePath)
        //   .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
        //   .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
        //   .format('mp4')
        //   .outputOptions('-vf', `scale=${resolutionConfig[res as keyof typeof resolutionConfig].width}:-1`) // Set the width and calculate the height
        //   .outputOptions('-b:v', resolutionConfig[res as keyof typeof resolutionConfig].bitrate) // Set the video bitrate
        //   .output(outputPath)
        //   .on('start', function(commandLine) {
        //     console.log(`[${res}] Spawned Ffmpeg with command: ${commandLine}`);
        //   })
        //   .on('error', function(err, stdout, stderr) {
        //     console.log(`[${res}] Error: ${err.message}`);
        //     console.log(`[${res}] ffmpeg stdout: ${stdout}`);
        //     console.log(`[${res}] ffmpeg stderr: ${stderr}`);
        //   })
        //   .on('progress', function(progress) {
        //     if (progress.percent) {
        //       console.log(`[${res}] Processing: ${progress.percent.toFixed(2)}% done`);
        //     }
        //   })
        //   .on('end', function() {
        //     console.log(`[${res}] Conversion Done`);
        //   })
        //   .run();
      }
    } else {
      console.error('No video stream found in file');
    }
  });

  const videoPath = req.file.path;
  generateThumbnail(videoPath);

  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }
  const file = req.file;
  const data = {
    id: 0, // You'll need to generate or fetch this
    title: file.originalname,
    channel: 'Description', // You'll need to generate or fetch this
    img: 'https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif', // You'll need to generate or fetch this
    slug: file.filename,
    quality: '1080p', // You'll need to generate or fetch this
    duration: 100000, // You'll need to generate or fetch this
    view: 100000, // You'll need to generate or fetch this
    timeUpload: new Date().toISOString(),
    filename: file.filename,
    path: file.path,
    size: file.size
  };

  fs.writeFileSync('data.txt', JSON.stringify(data));

  res.send('original Video uploaded successfully.');
}
