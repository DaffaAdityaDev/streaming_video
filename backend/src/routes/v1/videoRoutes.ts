import { getThumbnail, getVideosByUserEmail } from '../../controllers/videoController';
import { Router } from 'express';
import { uploadVideo, getVideo, updateVideo, getAllVideos, streamVideo } from '../../controllers/videoController';
import authMiddleware from '../../middlewares/authMiddleware';
import multer from 'multer';
import path from 'path';
import { validateVideoUpload, validateVideoUpdate, validate } from '../../middlewares/validationMiddleware';
import fs from 'fs';
import express from 'express';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../../../video/uploads/');
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});
 
// Version 1 routes
const v1Router = Router();

v1Router.get('/', getAllVideos);
v1Router.use('/thumbnail', express.static(path.join(__dirname, '../../../thumbnails')));
v1Router.post('/upload', authMiddleware, upload.single('video'), validateVideoUpload, validate, uploadVideo);
v1Router.put('/:slug', authMiddleware, validateVideoUpdate, validate, updateVideo);
v1Router.get('/user/:email', getVideosByUserEmail);
v1Router.get('/thumbnail/:videoId', getThumbnail);
v1Router.get('/stream/:quality/:slug', streamVideo);  // Changed to include '/stream' prefix
v1Router.get('/list-files', (req, res) => {
  const videoDir = path.join(__dirname, '../../../video/');
  const files = fs.readdirSync(videoDir, { withFileTypes: true });
  const fileStructure = files.map(file => {
    if (file.isDirectory()) {
      const subDir = path.join(videoDir, file.name);
      const subFiles = fs.readdirSync(subDir);
      return { [file.name]: subFiles };
    }
    return file.name;
  });
  res.json(fileStructure);
});

// Apply v1 routes to the main router
router.use('/v1/video', v1Router);

export default router;