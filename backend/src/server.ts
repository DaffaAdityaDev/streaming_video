import express, { Request, Response } from 'express';
import { streamVideoFile, handleFileUpload, MakeVideoQueue } from './utils';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import swaggerUi from 'swagger-ui-express'
import openApiJSON from './api/openapi.json'
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const videoQueue = MakeVideoQueue(4);

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

dotenv.config();

const PORT = process.env.PORT || 3001;
console.log(process.env.PORT);
const APP = express();

APP.use(express.json());
APP.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
APP.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiJSON));

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
  console.log(username);
  const hashedPassword = await bcrypt.hash(password, 10);

  if (!username || !email || !password) {
    return res.status(200).json({
      status: 'error',
      message: 'Please fill in all fields',
    });
  }

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
      return res.status(200).json({
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
    res.status(200).json({
      status: 'error',
      message: error,
    });
  }
});

APP.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error no Token Generated',
    });
  }
  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

  try {
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return res.status(203).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      
      return res.status(203).json({
        status: 'error',
        message: 'Invalid password',
      });
    }

    await prisma.users.update({
      where: {
        email,
      },
      data: {
        token,
      },
    });

    return res.json({
      status: 'success',
      message: 'User logged in successfully',
      token,
      username: user.username,
      email: user.email,
      image_url: user.image_url,
      
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error,
    });
  }
});


// experimental not working
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
  const slug = req.query.slug || req.params[0];
  await streamVideoFile(req, res, slug);
});

// upload video
APP.post('/upload', upload.single('video'), async(req: Request, res: Response) => {
  await handleFileUpload(req, res, videoQueue);
});

APP.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`)
});
