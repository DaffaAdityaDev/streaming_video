"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getThumbnail = exports.getVideosByUserEmail = exports.getAllVideos = exports.updateVideo = exports.getVideo = exports.uploadVideo = exports.streamVideo = void 0;
const videoService_1 = __importDefault(require("../services/videoService"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const streamVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { quality, slug } = req.params;
        const videoDir = path_1.default.join(__dirname, '../../video');
        const videoPath = path_1.default.join(videoDir, quality, `${slug}.mp4`);
        console.log('Video Directory:', videoDir);
        console.log('Video Path:', videoPath);
        if (!fs_1.default.existsSync(videoPath)) {
            console.log('File does not exist:', videoPath);
            console.log('Contents of video directory:', fs_1.default.readdirSync(videoDir));
            console.log('Contents of quality directory:', fs_1.default.readdirSync(path_1.default.join(videoDir, quality)));
            return res.status(404).json({ message: 'Video file not found' });
        }
        const stat = fs_1.default.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs_1.default.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
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
            fs_1.default.createReadStream(videoPath).pipe(res);
        }
    }
    catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({ message: 'Error streaming video' });
    }
});
exports.streamVideo = streamVideo;
const uploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const video = yield videoService_1.default.uploadVideo(req.file, req.user.id_user, io);
        // console.log(video)
        res.status(201).json({
            status: 'success',
            data: video,
        });
    }
    catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
        });
    }
});
exports.uploadVideo = uploadVideo;
const getVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { quality, slug } = req.params;
        console.log(`Requested video: quality=${quality}, slug=${slug}`);
        const videoDir = path_1.default.join(__dirname, '../../../video/');
        const videoPath = path_1.default.join(videoDir, quality, `${slug}.mp4`);
        console.log('Full video path:', videoPath);
        console.log('__dirname:', __dirname);
        console.log('File exists:', fs_1.default.existsSync(videoPath));
        if (!fs_1.default.existsSync(videoPath)) {
            console.log('Parent directory contents:', fs_1.default.readdirSync(path_1.default.dirname(videoPath)));
            return res.status(404).json({ message: 'Video file not found' });
        }
        const stat = fs_1.default.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs_1.default.createReadStream(videoPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
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
            fs_1.default.createReadStream(videoPath).pipe(res);
        }
    }
    catch (error) {
        console.error('Error streaming video:', error);
        res.status(500).json({ message: 'Error streaming video' });
    }
});
exports.getVideo = getVideo;
const updateVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { slug } = req.params;
        const { title, description } = req.body;
        const video = yield videoService_1.default.updateVideoDetails(slug, title, description);
        res.status(200).json({
            status: 'success',
            message: 'Video updated successfully',
            data: video,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(error.message === 'Video not found' ? 404 : 500).json({
                status: 'error',
                message: error.message,
            });
        }
    }
});
exports.updateVideo = updateVideo;
const getAllVideos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const videos = yield videoService_1.default.getAllVideos();
        res.status(200).json({
            status: 'success',
            data: videos,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
        });
    }
});
exports.getAllVideos = getAllVideos;
const getVideosByUserEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const encodedEmail = req.params.email;
        const userEmail = atob(encodedEmail); // Base64 decode the email
        const videos = yield videoService_1.default.getVideosByUserEmail(userEmail);
        console.log('getVideosByUserEmail called with email:', encodedEmail);
        console.log('email:', userEmail);
        // console.log('videos:', videos);
        res.status(200).json({
            status: 'success',
            data: videos,
        });
    }
    catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({
            status: 'error',
            message: error instanceof Error ? error.message : 'An unknown error occurred',
        });
    }
});
exports.getVideosByUserEmail = getVideosByUserEmail;
const getThumbnail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { videoId } = req.params;
        const thumbnail = yield videoService_1.default.getThumbnail(videoId);
        const thumbnailPath = path_1.default.join(__dirname, '../../thumbnails', thumbnail);
        console.log('Thumbnail path:', thumbnailPath);
        console.log('File exists:', fs_1.default.existsSync(thumbnailPath));
        if (!fs_1.default.existsSync(thumbnailPath)) {
            return res.status(404).json({ message: 'Thumbnail not found' });
        }
        res.sendFile(thumbnailPath);
    }
    catch (error) {
        console.error('Error retrieving thumbnail:', error);
        res.status(500).json({ message: 'Error retrieving thumbnail' });
    }
});
exports.getThumbnail = getThumbnail;
