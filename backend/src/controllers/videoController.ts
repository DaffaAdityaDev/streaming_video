import { Request, Response } from 'express';
import videoService from '../services/videoService';
import { RequestWithUser } from '../types';
import path from 'path';
import fs from 'fs';


export const streamVideo = async (req: Request, res: Response) => {
  try {
    const { quality, slug } = req.params;
    // const videoDir = path.join(__dirname, '../../../backend/video/');
    // const videoPath = path.join(videoDir, quality, `${slug}.mp4`);

    const videoDir = path.join(__dirname, '../../video');
    const videoPath = path.join(videoDir, quality, `${slug}.mp4`);

    console.log('Video Directory:', videoDir);
    console.log('Video Path:', videoPath);

    if (!fs.existsSync(videoPath)) {
      console.log('File does not exist:', videoPath);
      console.log('Contents of video directory:', fs.readdirSync(videoDir));
      console.log('Contents of quality directory:', fs.readdirSync(path.join(videoDir, quality)));
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
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
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ message: 'Error streaming video' });
  }
};

export const uploadVideo = async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file provided',
      });
    }

    if (!req.user || !req.user.id_user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: User information not found',
      });
    }

    const io = req.app.get('io');
    const video = await videoService.uploadVideo(req.file, req.user.id_user, io);
    // console.log(video)
    res.status(201).json({
      status: 'success',
      data: video,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

export const getVideo = async (req: Request, res: Response) => {
  try {
    const { quality, slug } = req.params;
    console.log(`Requested video: quality=${quality}, slug=${slug}`);

    const videoDir = path.join(__dirname, '../../../video/');
    const videoPath = path.join(videoDir, quality, `${slug}.mp4`);
    
    console.log('Full video path:', videoPath);
    console.log('__dirname:', __dirname);
    console.log('File exists:', fs.existsSync(videoPath));

    if (!fs.existsSync(videoPath)) {
      console.log('Parent directory contents:', fs.readdirSync(path.dirname(videoPath)));
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize-1;
      const chunksize = (end-start)+1;
      const file = fs.createReadStream(videoPath, {start, end});
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
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
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ message: 'Error streaming video' });
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { title, description } = req.body;
    const video = await videoService.updateVideoDetails(slug, title, description);
    res.status(200).json({
      status: 'success',
      message: 'Video updated successfully',
      data: video,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(error.message === 'Video not found' ? 404 : 500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
};

export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const videos = await videoService.getAllVideos();
    res.status(200).json({
      status: 'success',
      data: videos,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

export const getVideosByUserEmail = async (req: Request, res: Response) => {
  try {
    const encodedEmail = req.params.email;
    const userEmail = atob(encodedEmail); // Base64 decode the email
    const videos = await videoService.getVideosByUserEmail(userEmail);
    console.log('getVideosByUserEmail called with email:', encodedEmail);
    console.log('email:', userEmail);
    // console.log('videos:', videos);
    res.status(200).json({
      status: 'success',
      data: videos,
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }); 
  }
};

export const getThumbnail = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const thumbnail = await videoService.getThumbnail(videoId);
    const thumbnailPath = path.join(__dirname, '../../thumbnails', thumbnail);

    console.log('Thumbnail path:', thumbnailPath);
    console.log('File exists:', fs.existsSync(thumbnailPath));

    if (!fs.existsSync(thumbnailPath)) {
      return res.status(404).json({ message: 'Thumbnail not found' });
    }

    res.sendFile(thumbnailPath);
  } catch (error) {
    console.error('Error retrieving thumbnail:', error);
    res.status(500).json({ message: 'Error retrieving thumbnail' });
  }
};