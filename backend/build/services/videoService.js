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
const videoRepository_1 = __importDefault(require("../repository/videoRepository"));
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const ffprobe_1 = __importDefault(require("@ffprobe-installer/ffprobe"));
const dotenv_1 = __importDefault(require("dotenv"));
const videoProcessing_1 = require("../utils/videoProcessing");
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.default.path);
dotenv_1.default.config();
const uploadVideo = (file, userId, io) => __awaiter(void 0, void 0, void 0, function* () {
    const slug = (0, uuid_1.v4)();
    try {
        // Step 1: Create initial video entry
        const videoData = {
            title_video: file.originalname,
            description: '',
            channel: '',
            slug,
            thumbnail: `${slug}.png`,
            quality: 'defaultQuality',
            views: 0,
            likes: 0,
            id_user: userId,
        };
        const video = yield videoRepository_1.default.create(videoData);
        // Step 2: Process video asynchronously
        (0, videoProcessing_1.processVideo)(file, slug, io).then((highestQuality) => __awaiter(void 0, void 0, void 0, function* () {
            yield videoRepository_1.default.update(slug, { quality: highestQuality });
            io.emit('processingComplete', { file: slug });
            // Generate thumbnail after processing
            const defaultQualityPath = path_1.default.join(__dirname, '../../video/defaultQuality', `${slug}.mp4`);
            yield (0, videoProcessing_1.generateThumbnail)(defaultQualityPath, slug);
        })).catch((error) => __awaiter(void 0, void 0, void 0, function* () {
            console.error('Error processing video:', error);
            io.emit('processingError', { file: slug, error: error.message });
            // Update the video entry to indicate processing failure
            yield videoRepository_1.default.update(slug, { quality: 'processing_failed' });
        }));
        return video;
    }
    catch (error) {
        console.error('Error in uploadVideo:', error);
        throw error;
    }
});
const getVideoBySlug = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    const video = yield videoRepository_1.default.findBySlug(slug);
    if (!video) {
        console.log('Video not found');
    }
    return video;
});
const updateVideoDetails = (slug, title, description) => __awaiter(void 0, void 0, void 0, function* () {
    const video = yield videoRepository_1.default.update(slug, { title_video: title, description });
    if (!video) {
        console.log('Video not found');
    }
    return video;
});
const getAllVideos = () => __awaiter(void 0, void 0, void 0, function* () {
    return videoRepository_1.default.findAll({
        orderBy: {
            created_at: 'desc'
        }
    });
});
const getVideosByUserEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const videos = yield videoRepository_1.default.findByUserEmail(email);
    return videos.map(video => ({
        id_video: video.id_video,
        title_video: video.title_video,
        description: video.description,
        thumbnail: video.thumbnail,
        slug: video.slug
    }));
});
const getThumbnail = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    const thumbnail = yield videoRepository_1.default.getThumbnailByVideoId(videoId);
    if (!thumbnail) {
        throw new Error('Thumbnail not found');
    }
    return thumbnail;
});
exports.default = { uploadVideo, getVideoBySlug, updateVideoDetails, getAllVideos, getVideosByUserEmail, getThumbnail };
