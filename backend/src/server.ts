import express, { Request, Response } from 'express';
import {
  streamVideoFile,
  handleFileUpload,
  MakeVideoQueue,
  handleTitleAndDescVideo,
} from './utils';
import checkToken from './utils/checkToken';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffprobePath from '@ffprobe-installer/ffprobe';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';
import bcrypt from 'bcrypt';
import { PrismaClient, Users } from '@prisma/client';
import swaggerUi from 'swagger-ui-express';
import openApiJSON from './api/openapi.json';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';

const prisma = new PrismaClient();

ffmpeg.setFfmpegPath(ffmpegPath.path);
ffmpeg.setFfprobePath(ffprobePath.path);

dotenv.config();

const PORT = process.env.PORT || 3001;
// console.log(process.env.PORT);
const APP = express();
const server = http.createServer(APP);

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

const videoQueue = MakeVideoQueue(4);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

APP.use(express.json());
APP.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  next();
});
APP.use(cors({
  origin: 'http://localhost:3000', // Replace with the actual origin of your frontend if different
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the methods you want to allow
  allowedHeaders: ['Content-Type', 'Authorization'], // Specify any additional headers you want to allow
}));

APP.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiJSON));

const storage = multer.diskStorage({
  destination: function (
    req: any,
    file: any,
    cb: (arg0: null, arg1: string) => void,
  ) {
    const dir = path.join(__dirname, '../video/defaultQuality/');

    // Create the directory if it doesn't exist
    fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: function (
    req: any,
    file: { fieldname: string; originalname: string },
    cb: (arg0: null, arg1: string) => void,
  ) {
    cb(
      null,
      file.fieldname + '-' + Date.now() + path.extname(file.originalname),
    );
  },
});

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
        OR: [{ username: username }, { email: email }],
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
        image_url:
          'https://res.cloudinary.com/dkkgmzpqd/image/upload/v1628074759/default-profile-picture-300x300_y3c5xw.png',
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
  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

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
APP.get('/video/*', async (req: Request, res: Response) => {
  const slug = req.query.slug || req.params[0];
  await streamVideoFile(req, res, slug);
});

// get all videos
APP.get('/videos', async (req: Request, res: Response) => {
  const videos = await prisma.videos.findMany({
    orderBy: {
      created_at: 'desc',
    },
  });

  res.json(videos);
});

// get specific user video
APP.post('/videos', async (req, res) => {
  const { email } = req.body;
  try {
    // Find the user by email to get their id_user
    const user = await prisma.users.findUnique({
      where: {
        email: email,
      },
    });
    console.log(user);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    // Fetch videos for the specific user using their id_user
    const videos = await prisma.videos.findMany({
      where: {
        id_user: user.id_user,
      },
      include: {
        user: true, // Include user details in the response
      },
    });

    res.status(200).json({
      status: 'success',
      data: videos,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: (error as Error).message,
    });
  }
});

APP.get('/thumbnail/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const thumbnailPath = path.join(__dirname, `../thumbnails/${slug}.png`);
  console.log(thumbnailPath);

  if (!fs.existsSync(thumbnailPath)) {
    return res.status(404).send('Thumbnail not found');
  }

  res.sendFile(thumbnailPath);
});

// upload video
APP.post(
  '/upload',
  checkToken,
  upload.single('video'),
  async (req: Request, res: Response) => {
    await handleFileUpload(req, res, videoQueue, io);
  },
);

// upload title and description
APP.post('/upload/title', async (req: Request, res: Response) => {
  await handleTitleAndDescVideo(req, res, videoQueue);
});

APP.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

server.listen(8001, () => {
  console.log('listening on *:8001');
});
