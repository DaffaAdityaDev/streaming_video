"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const PORT = 8000;
const APP = (0, express_1.default)();
APP.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
APP.get('/', (req, res) => {
    res.send('Hello, Developer! start you CRAFT here');
});
APP.get('/video/:quality/:slug/:segment', (req, res) => {
    const { quality, slug, segment } = req.params;
    const videoPath = `video/${quality}/${slug}.mp4`;
    const start = +segment * 10; // assuming each segment is 10 seconds long
    const duration = 10;
    (0, fluent_ffmpeg_1.default)(videoPath)
        .seekInput(start)
        .duration(duration)
        .outputOptions('-f segment')
        .outputOptions('-segment_time 10')
        .output('pipe:1')
        .pipe(res);
});
// direct video streaming
APP.get('/video/*', (req, res) => {
    const CHUNK_SIZE = 520 * 1024; // 1MB
    const slug = req.query.slug || req.params[0];
    const videoPath = `video/${slug}.mp4`;
    if (!videoPath) {
        res.status(404).send('Video not found');
        return;
    }
    if (!fs_1.default.existsSync(videoPath)) {
        res.status(404).send('Video not found');
        return;
    }
    // const videoPath = 'video/flower.mp4';
    const stat = fs_1.default.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize - 1;
        if (isNaN(start) || isNaN(end)) {
            res.status(400).send('Invalid range');
            return;
        }
        // const chunksize = (end-start)+1;
        const file = fs_1.default.createReadStream(videoPath, { start, end, highWaterMark: CHUNK_SIZE });
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
    }
    else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(200, head);
        const file = fs_1.default.createReadStream(videoPath, { highWaterMark: CHUNK_SIZE });
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
    console.log(`http://localhost:8000`);
});
