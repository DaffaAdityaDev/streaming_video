import express, { Request, Response } from 'express';
import { promisify } from 'util';
import spdy from 'spdy';
import  fs from 'fs';
import path from 'path';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

const access = promisify(fs.access);

const PORT = 8000;
const APP = express();

APP.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: (arg0: null, arg1: string) => void) {
    const dir = path.join(__dirname, '../video/defaultQuality/');
    cb(null, dir)
  },
  filename: function (req: any, file: { fieldname: string; originalname: string; }, cb: (arg0: null, arg1: string) => void) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})
const upload = multer({ storage: storage });

APP.get('/', (req: Request, res: Response) => {
  res.send('Hello, Developer! start you CRAFT here');
});

// segment video streaming
APP.get('/video/:quality/:slug/:segment', (req: Request, res: Response) => {
  const { quality, slug, segment } = req.params;

  // Validate quality and segment
  if (!['1080p', '720p', '480p', '360p', '240p'].includes(quality)) {
    return res.status(400).send('Invalid quality parameter');
  }
  if (isNaN(Number(segment))) {
    return res.status(400).send('Invalid segment parameter');
  }

  const videoPath = `video/${quality}/${slug}.mp4`;

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send('Video file not found');
  }

  const start = +segment * 10; // assuming each segment is 10 seconds long
  const duration = 10;

  ffmpeg(videoPath)
    .seekInput(start)
    .duration(duration)
    .outputOptions('-f segment')
    .outputOptions('-segment_time 10')
    .output('pipe:1')
    .pipe(res);

});

// direct video streaming
APP.get('/video/*', async(req: Request, res: Response) => {
  const CHUNK_SIZE = 520 * 1024; // 520kb

  const slug = req.query.slug || req.params[0]
  const videoPath = `video/${slug}.mp4`

  try {
    await access(videoPath);
  } catch {
    res.status(404).send('Video not found');
    return;
  }

  // const videoPath = 'video/flower.mp4';
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] 
      ? parseInt(parts[1], 10)
      : fileSize-1;

    if (isNaN(start) || isNaN(end)) {
      res.status(400).send('Invalid range');
      return;
    }

    // const chunksize = (end-start)+1;
    const file = fs.createReadStream(videoPath, {start, end, highWaterMark: CHUNK_SIZE});

    file.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes of data.`);
    });
    
    file.on('end', () => {
      console.log('There will be no more data.');
    });
    
    file.on('error', (err) => {
      console.error('An error occurred:', err);
      res.status(500).send('Server error');
    });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': CHUNK_SIZE,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);

  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(200, head);
    const file = fs.createReadStream(videoPath, {highWaterMark: CHUNK_SIZE});
    file.pipe(res);

    file.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes of data.`);
    });

    file.on('end', () => {
      console.log('There will be no more data.');
    });

    file.on('error', (err) => {
      console.error('An error occurred:', err);
      res.status(500).send('Server error');
    });

  }
});

// upload video
APP.post('/upload', upload.single('video'), (req, res) => {
  // req.file is the `video` file
  // req.body will hold the text fields, if there were any
  if (!req.file) {
    res.status(400).send('No file uploaded');
    return;
  }

  const { path: filePath, filename } = req.file;

  // Define the output directories for each resolution
  const resolutionConfig = {
    '480p': {
      width: '854',
      outputDir: path.join(__dirname, '../video/480p/')
    },
    '720p': {
      width: '1280',
      outputDir: path.join(__dirname, '../video/720p/')
    },
    '1080p': {
      width: '1920',
      outputDir: path.join(__dirname, '../video/1080p/')
    },
    '4k': {
      width: '3840',
      outputDir: path.join(__dirname, '../video/4k/')
    },
    // Add other resolutions as needed
  };
  
  
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
      let selectedResolution
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
      fs.mkdirSync(outputDir, { recursive: true }); // Create the directory if it does not exist
      const outputPath = path.join(outputDir, filename);
      ffmpeg(filePath)
      .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
      .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
      .format('mp4')
      .outputOptions('-vf', `scale=${resolutionConfig[res as keyof typeof resolutionConfig].width}:-1`) // Set the width and calculate the height
      // Add other output options as needed, such as bitrate
      .output(outputPath)
      .on('progress', function(progress) {
          console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
      })
      .on('end', function() {
          console.log('Conversion Done');
      })
      .run();
    } else {
      console.error('No video stream found in file');
    }
  });

  res.send('Video uploaded successfully.');
});



APP.listen(PORT, () => {
  console.log(`http://localhost:8000`)
});

