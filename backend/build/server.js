"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const util_1 = require("util");
const http2 = __importStar(require("http2"));
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const access = (0, util_1.promisify)(fs.access);
const PORT = 8000;
const APP = (0, express_1.default)();
const server = http2.createSecureServer({
    key: fs.readFileSync(path_1.default.resolve(__dirname, '../certs/key.pem')),
    cert: fs.readFileSync(path_1.default.resolve(__dirname, '../certs/cert.pem')),
});
server.on('stream', (stream, headers) => {
    stream.respond({
        'content-type': 'text/html',
        ':status': 200
    });
    stream.end('<h1>Hello World</h1>');
});
server.listen(PORT);
console.log(`http://localhost:${PORT}`);
// APP.use((req: Request, res: Response, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
//   next();
// });
// APP.get('/', (req: Request, res: Response) => {
//   res.send('Hello, Developer! start you CRAFT here');
// });
// // segment video streaming
// APP.get('/video/:quality/:slug/:segment', (req: Request, res: Response) => {
//   const { quality, slug, segment } = req.params;
//   // Validate quality and segment
//   if (!['1080p', '720p', '480p', '360p', '240p'].includes(quality)) {
//     return res.status(400).send('Invalid quality parameter');
//   }
//   if (isNaN(Number(segment))) {
//     return res.status(400).send('Invalid segment parameter');
//   }
//   const videoPath = `video/${quality}/${slug}.mp4`;
//   if (!fs.existsSync(videoPath)) {
//     return res.status(404).send('Video file not found');
//   }
//   const start = +segment * 10; // assuming each segment is 10 seconds long
//   const duration = 10;
//   ffmpeg(videoPath)
//     .seekInput(start)
//     .duration(duration)
//     .outputOptions('-f segment')
//     .outputOptions('-segment_time 10')
//     .output('pipe:1')
//     .pipe(res);
// });
// // direct video streaming
// APP.get('/video/*', async(req: Request, res: Response) => {
//   const CHUNK_SIZE = 520 * 1024; // 520kb
//   const slug = req.query.slug || req.params[0]
//   const videoPath = `video/${slug}.mp4`
//   try {
//     await access(videoPath);
//   } catch {
//     res.status(404).send('Video not found');
//     return;
//   }
//   // const videoPath = 'video/flower.mp4';
//   const stat = fs.statSync(videoPath);
//   const fileSize = stat.size;
//   const range = req.headers.range;
//   if (range) {
//     const parts = range.replace(/bytes=/, "").split("-");
//     const start = parseInt(parts[0], 10);
//     const end = parts[1] 
//       ? parseInt(parts[1], 10)
//       : fileSize-1;
//     if (isNaN(start) || isNaN(end)) {
//       res.status(400).send('Invalid range');
//       return;
//     }
//     // const chunksize = (end-start)+1;
//     const file = fs.createReadStream(videoPath, {start, end, highWaterMark: CHUNK_SIZE});
//     file.on('data', (chunk) => {
//       console.log(`Received ${chunk.length} bytes of data.`);
//     });
//     file.on('end', () => {
//       console.log('There will be no more data.');
//     });
//     file.on('error', (err) => {
//       console.error('An error occurred:', err);
//       res.status(500).send('Server error');
//     });
//     const head = {
//       'Content-Range': `bytes ${start}-${end}/${fileSize}`,
//       'Accept-Ranges': 'bytes',
//       'Content-Length': CHUNK_SIZE,
//       'Content-Type': 'video/mp4',
//     };
//     res.writeHead(206, head);
//     file.pipe(res);
//   } else {
//     const head = {
//       'Content-Length': fileSize,
//       'Content-Type': 'video/mp4',
//     };
//     res.writeHead(200, head);
//     const file = fs.createReadStream(videoPath, {highWaterMark: CHUNK_SIZE});
//     file.pipe(res);
//     file.on('data', (chunk) => {
//       console.log(`Received ${chunk.length} bytes of data.`);
//     });
//     file.on('end', () => {
//       console.log('There will be no more data.');
//     });
//     file.on('error', (err) => {
//       console.error('An error occurred:', err);
//       res.status(500).send('Server error');
//     });
//   }
// });
// APP.listen(PORT, () => {
//   console.log(`http://localhost:8000`)
// });
