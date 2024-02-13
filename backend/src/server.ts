import express, { Request, Response } from 'express';
import { promisify, generateThumbnail } from './utils';
import  fs from 'fs';
import path from 'path';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import async from 'async';

interface Task {
  filePath: string;
  resolutionConfig: {
    width: string;
    bitrate: string;
  };
  outputPath: string;
  res: string;
}

const prisma = new PrismaClient();


ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

const access = promisify(fs.access);

const PORT = process.env.PORT || 3001;
const APP = express();

APP.use(express.json());
APP.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/**
 * The storage configuration for multer.
 * 
 * This configuration specifies where and how uploaded files should be stored.
 * 
 * @type {multer.StorageEngine}
 * 
 * @property {Function} destination - A function to control where uploaded files should be stored.
 * @property {Function} filename - A function to control what the uploaded file should be named.
 */
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: (arg0: null, arg1: string) => void) {
    const dir = path.join(__dirname, '../video/defaultQuality/');

    // Create the directory if it doesn't exist
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir)
  },
  filename: function (req: any, file: { fieldname: string; originalname: string; }, cb: (arg0: null, arg1: string) => void) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage });
APP.use('/video', express.static('video'));
APP.use('/thumbnails', express.static('thumbnails'));

APP.get('/', (req: Request, res: Response) => {
  res.send('Hello, Developer! start you CRAFT here');
});

APP.post('/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const checkUser = await prisma.users.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email },
        ],
      },
    });

    if (checkUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists',
      });
    }

    const user = await prisma.users.create({
      data: {
        username,
        email,
        password: hashedPassword,
        image_url: 'https://res.cloudinary.com/dkkgmzpqd/image/upload/v1628074759/default-profile-picture-300x300_y3c5xw.png',
      },
    });

    return res.json({
      status: 'success',
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error,
    });
  }
});

APP.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid password',
      });
    }

    return res.json({
      status: 'success',
      message: 'User logged in successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error,
    });
  }
});



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



// Create a queue object with concurrency 4
const VideoQueue = async.queue((task: Task, callback) => {
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
}, 4);

/**
 * Handles the POST request for the '/upload' route.
 * 
 * This function is responsible for handling file uploads. It uses multer to process the uploaded file.
 * If no file is uploaded, it sends a 400 status code with a message 'No file uploaded'.
 * It then checks if the uploaded file exists in the file system. If not, it sends a 404 status code with a message 'Video file not found'.
 * 
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @returns {void}
 */
APP.post('/upload', upload.single('video'), (req, res) => {
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
  const resolutionConfig = {
    '144p': {
      width: '256',
      outputDir: path.join(__dirname, '../video/144p/'),
      bitrate: '1000k'
    },
    '240p': {
      width: '426',
      outputDir: path.join(__dirname, '../video/240p/'),
      bitrate: '1500k'
    },
    '480p': {
      width: '854',
      outputDir: path.join(__dirname, '../video/480p/'),
      bitrate: '2500k'
    },
    '720p': {
      width: '1280',
      outputDir: path.join(__dirname, '../video/720p/'),
      bitrate: '5000k'
    },
    '1080p': {
      width: '1920',
      outputDir: path.join(__dirname, '../video/1080p/'),
      bitrate: '8000k'
    },
    '4k': {
      width: '3840',
      outputDir: path.join(__dirname, '../video/4k/'),
      bitrate: '35000k'
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
});



APP.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
});
