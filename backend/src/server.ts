import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const PORT = 8000;
const APP = express();

APP.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

APP.get('/', (req: Request, res: Response) => {
  res.send('Hello, Developer! start you CRAFT here');
});

APP.get('/video/*', (req: Request, res: Response) => {
  const CHUNK_SIZE = 10 ** 6; // 1MB

  const slug = req.query.slug || req.params[0]
  const videoPath = `video/${slug}.mp4`
  
  if (!videoPath) {
    res.status(404).send('Video not found');
    return;
  }

  if (!fs.existsSync(videoPath)) {
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

APP.listen(PORT, () => {
  console.log(`http://localhost:8000`)
});

