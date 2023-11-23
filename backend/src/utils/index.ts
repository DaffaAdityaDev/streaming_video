import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

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
    })
    .on('error', function(err) {
      console.error('Error generating thumbnail:', err);
    })
    .on('end', function() {
      console.log('Thumbnail generated');
      console.log('Thumbnail path:', path.join(thumbnailPath, thumbnailName));
    });
}