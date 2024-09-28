import { NextFunction, Request, Response } from 'express';
import videoService from '../services/videoService';
import { AuthenticatedRequest, RequestWithUser } from '../types';
import path from 'path';
import fs from 'fs';
import videoRepository from '../repository/videoRepository';
import { createLogger } from '../utils/logger';
import { AppError } from '../utils/AppError';
import { Video } from '../models/videoModel';

const logger = createLogger('videoController');

async function syncVideoStatus(slug: string, videoExists: boolean, thumbnailExists: boolean) {
  if (!videoExists && !thumbnailExists) {
    await videoRepository.deleteBySlug(slug);
    logger.info(`Deleted database entry for non-existent video and thumbnail: ${slug}`);
  } else if (!videoExists) {
    await videoRepository.updateVideoStatus(slug, 'FILE_MISSING');
    logger.info(`Updated status to FILE_MISSING for video: ${slug}`);
  } else if (!thumbnailExists) {
    logger.info(`Thumbnail missing for video: ${slug}`);
    // You might want to regenerate the thumbnail here
  }
}

export const streamVideo = async (req: Request, res: Response) => {
  try {
    const { quality, slug } = req.params;

    const videoDir = path.join(__dirname, '../../video');
    const videoPath = path.join(videoDir, quality, `${slug}.mp4`);
    const thumbnailPath = path.join(__dirname, '../../thumbnails', `${slug}.jpg`);

    const videoExists = fs.existsSync(videoPath);
    const thumbnailExists = fs.existsSync(thumbnailPath);

    if (!videoExists || !thumbnailExists) {
      await syncVideoStatus(slug, videoExists, thumbnailExists);
      if (!videoExists) {
        return res.status(404).json({ message: 'Video file not found' });
      }
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
    logger.error('Error streaming video:', error);
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
    logger.error('Error uploading video:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    });
  }
};

export const getVideo = async (req: Request, res: Response) => {
  try {
    const { quality, slug } = req.params;
    logger.info(`Requested video: quality=${quality}, slug=${slug}`);

    const videoDir = path.join(__dirname, '../../../video/');
    const videoPath = path.join(videoDir, quality, `${slug}.mp4`);
    
    logger.debug('Full video path:', videoPath);
    logger.debug('__dirname:', __dirname);
    logger.debug('File exists:', fs.existsSync(videoPath));

    if (!fs.existsSync(videoPath)) {
      logger.warn('Parent directory contents:', fs.readdirSync(path.dirname(videoPath)));
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
    logger.error('Error streaming video:', error);
    res.status(500).json({ message: 'Error streaming video' });
  }
};

export const updateVideo = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title_video, description } = req.body;
    
    console.log('Received update request:', { id, title_video, description });

    if (!id || (!title_video && !description)) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: id and at least one of title_video or description',
      });
    }

    const updateData: Partial<Video> = {};
    if (title_video) updateData.title_video = title_video;
    if (description) updateData.description = description;

    const video = await videoService.updateVideo(Number(id), updateData);
    res.status(200).json({
      status: 'success',
      message: 'Video details updated successfully',
      data: video,
    });
  } catch (error) {
    console.error('Error updating video:', error);
    if (error instanceof Error) {
      res.status(error.message === 'Video not found' ? 404 : 500).json({
        status: 'error',
        message: error.message,
      });
    } else {
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
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

export const getVideosByUserEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('getVideosByUserEmail route hit');
    const encodedEmail = req.params.email;
    const userEmail = atob(encodedEmail); // Base64 decode the email
    logger.debug('Decoded email:', userEmail);
    const videos = await videoService.getVideosByUserEmail(userEmail);
    logger.debug('Videos fetched:', videos);
    
    res.status(200).json({
      status: 'success',
      data: videos,
    });
  } catch (error) {
    logger.error('Error in getVideosByUserEmail:', error);
    next(error);
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


export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    let video;

    if (isNaN(Number(identifier))) {
      // If identifier is not a number, treat it as a slug
      const videoData = await videoService.getVideoBySlug(identifier);
      if (!videoData) {
        return res.status(404).json({ status: 'error', message: 'Video not found' });
      }
      video = await videoService.deleteVideo(videoData.id_video);
    } else {
      // If identifier is a number, treat it as an ID
      video = await videoService.deleteVideo(Number(identifier));
    }

    if (!video) {
      return res.status(404).json({ status: 'error', message: 'Video not found' });
    }

    res.status(200).json({ status: 'success', message: 'Video and associated files deleted successfully' });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ status: 'error', message: 'Failed to delete video' });
  }
};

export const incrementVideoView = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const video = await videoService.incrementVideoView(slug);
    res.status(200).json({ 
      status: 'success', 
      message: 'Video view incremented successfully', 
      data: {
        views: video.views
      } 
    });
  } catch (error) {
    console.error('Error incrementing video view:', error);
    res.status(500).json({ status: 'error', message: 'Failed to increment video view' });
  }
};

export const getVideoBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const video = await videoService.getVideoBySlug(slug);
    res.status(200).json({
      status: 'success',
      data: video,
    });
  } catch (error) {
    console.error('Error fetching video by slug:', error);
    res.status(500).json({ status: 'error', message: 'Failed to fetch video by slug' });
  }
};

export const updateThumbnail = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    const video = await videoService.getVideoBySlug(slug);
    if (!video) {
      return res.status(404).json({
        status: 'error',
        message: 'Video not found',
      });
    }

    const oldThumbnailPath = path.join(__dirname, '../../thumbnails', video.thumbnail);
    const newThumbnailFileName = `${slug}_${Date.now()}${path.extname(file.originalname)}`;
    const newThumbnailPath = path.join(__dirname, '../../thumbnails', newThumbnailFileName);

    // Check if old thumbnail exists and delete it
    if (fs.existsSync(oldThumbnailPath)) {
      fs.unlinkSync(oldThumbnailPath);
    }

    // Move the new thumbnail to the correct location
    fs.renameSync(file.path, newThumbnailPath);

    // Update the database
    const updatedVideo = await videoService.updateThumbnail(slug, newThumbnailFileName);

    res.status(200).json({
      status: 'success',
      message: 'Thumbnail updated successfully',
      data: {
        thumbnail: updatedVideo.thumbnail,
      },
    });
  } catch (error) {
    console.error('Error updating thumbnail:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating the thumbnail',
    });
  }
};