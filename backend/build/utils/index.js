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
exports.handleTitleAndDescVideo = exports.handleFileUpload = exports.MakeVideoQueue = exports.streamVideoFile = exports.fileExists = exports.generateThumbnail = exports.promisify = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const async_1 = __importDefault(require("async"));
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function promisify(fn) {
    return (...args) => {
        return new Promise((resolve, reject) => {
            fn(...args, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    };
}
exports.promisify = promisify;
function generateThumbnail(videoPath, uniqueId) {
    console.log('Generating thumbnail for', videoPath);
    const thumbnailPath = path_1.default.join(__dirname, '../../thumbnails');
    // Create the thumbnails directory if it does not exist
    if (!fs_1.default.existsSync(thumbnailPath)) {
        fs_1.default.mkdirSync(thumbnailPath, { recursive: true });
    }
    // Extract the video name and append '-thumbnail' to it
    // const videoName = path.basename(videoPath, path.extname(videoPath));
    const thumbnailName = `${uniqueId}.png`;
    (0, fluent_ffmpeg_1.default)(videoPath)
        .screenshots({
        timestamps: [1],
        filename: thumbnailName,
        folder: thumbnailPath,
        size: '320x240',
    })
        .on('progress', function (progress) {
        console.log('Processing: ' + progress.percent + '% done');
    })
        .on('error', function (err) {
        console.error('Error generating thumbnail:', err);
    })
        .on('end', function () {
        console.log('Thumbnail generated');
        console.log('Thumbnail path:', path_1.default.join(thumbnailPath, thumbnailName));
    });
}
exports.generateThumbnail = generateThumbnail;
function fileExists(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promisify(fs_1.default.access)(filePath);
            return true;
        }
        catch (error) {
            return false;
        }
    });
}
exports.fileExists = fileExists;
function getResolutionConfig(resolutions, bitrates, widths, outputDirs) {
    let config = {};
    for (let i = 0; i < resolutions.length; i++) {
        config[resolutions[i]] = {
            bitrate: bitrates[i],
            width: widths[i],
            outputDir: outputDirs[i],
        };
    }
    return config;
}
// Helper function to stream a video file
function streamVideoFile(req, res, slug) {
    return __awaiter(this, void 0, void 0, function* () {
        const slugStr = typeof slug === 'string' ? slug : Array.isArray(slug) ? slug[0] : '';
        const videoPath = path_1.default.join(__dirname, `../../video/${slugStr}.mp4`);
        console.log('Streaming video:', videoPath);
        // console.log(__dirname);
        if (!(yield fileExists(videoPath))) {
            const statusCode = 404;
            res.status(statusCode).send('Video not found');
            return;
        }
        const stat = fs_1.default.statSync(videoPath);
        const fileSize = stat.size;
        const range = req.headers.range;
        let start, end, contentLength;
        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            start = parseInt(parts[0], 10);
            end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            contentLength = end - start + 1;
        }
        else {
            start = 0;
            end = fileSize - 1;
            contentLength = fileSize;
        }
        console.log(contentLength, start, end, fileSize);
        const headers = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': contentLength,
            'Content-Type': 'video/mp4',
        };
        res.writeHead(range ? 206 : 200, headers);
        const readStream = fs_1.default.createReadStream(videoPath, { start, end });
        readStream.on('data', (chunk) => {
            // res.write(chunk);
            // console.log('chunk', chunk);
        });
        readStream.on('end', () => {
            console.log('stream end');
            res.end();
        });
        readStream.on('error', (err) => {
            console.error('An error occurred:', err);
            res.status(500).send('Server error');
        });
        readStream.pipe(res);
    });
}
exports.streamVideoFile = streamVideoFile;
// Create a queue object with concurrency
const MakeVideoQueue = (concurrency) => async_1.default.queue((task, callback) => {
    (0, fluent_ffmpeg_1.default)(task.filePath)
        .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
        .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
        .format('mp4')
        .outputOptions('-vf', `scale=${task.resolutionConfig.width}:-1`) // Set the width and calculate the height
        .outputOptions('-b:v', task.resolutionConfig.bitrate) // Set the video bitrate
        .output(task.outputPath)
        .on('start', function (commandLine) {
        console.log(
        // `[${task.res}] Spawned Ffmpeg with command: ${commandLine}`,
        'Start converting video...');
    })
        .on('error', function (err, stdout, stderr) {
        console.log(`[${task.res}] Error: ${err.message}`);
        console.log(`[${task.res}] ffmpeg stdout: ${stdout}`);
        console.log(`[${task.res}] ffmpeg stderr: ${stderr}`);
        callback(); // Call the callback function once the task is done
    })
        .on('progress', function (progress) {
        if (progress.percent) {
            // Calculate the overall progress
            const overallProgress = (task.processedVideos / task.totalVideos) * 100 +
                progress.percent / task.totalVideos;
            // Emit progress update to the client
            console.log(`[${task.res}] Conversion Progress: ${overallProgress.toFixed(2)}%`);
            task.io.emit('uploadProgress', {
                file: task.uniqueId,
                resolution: task.res,
                progress: overallProgress.toFixed(2),
            });
        }
    })
        .on('end', function () {
        console.log(`[${task.res}] Conversion Done`);
        task.io.emit('uploadProgress', {
            file: task.uniqueId,
            resolution: task.res,
            progress: 100,
        });
        callback(); // Call the callback function once the task is done
    })
        .run();
}, concurrency);
exports.MakeVideoQueue = MakeVideoQueue;
function processVideo(filePath, resolutionConfig, VideoQueue, io, uniqueId) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(filePath, function (err, metadata) {
            if (err || !metadata) {
                console.error('Error reading video file:', err);
                reject(err);
                return;
            }
            const videoStream = metadata.streams.find((stream) => stream.codec_type === 'video');
            if (videoStream) {
                const videoWidth = videoStream.width;
                // Sort the resolutions from lowest to highest
                const sortedResolutions = Object.entries(resolutionConfig).sort((a, b) => {
                    const widthA = parseInt(a[1].width);
                    const widthB = parseInt(b[1].width);
                    return widthA - widthB;
                });
                // Now you can use the resolution to select the correct output directory and frame size
                let selectedResolution = ['', {}];
                for (const [res, config] of sortedResolutions) {
                    const frameWidth = parseInt(config.width);
                    if (videoWidth && videoWidth <= frameWidth) {
                        selectedResolution = [res, config.outputDir];
                        break; // Exit the loop after finding the first matching resolution
                    }
                }
                if (!selectedResolution) {
                    selectedResolution = [
                        sortedResolutions[sortedResolutions.length - 1][0],
                        sortedResolutions[sortedResolutions.length - 1][1].outputDir,
                    ]; // Select the highest available resolution if none matched
                }
                let bigestResolution = selectedResolution[0];
                const selectedResolutionIndex = sortedResolutions.findIndex(([res]) => res === selectedResolution[0]);
                const totalVideos = selectedResolutionIndex + 1; // Total number of videos to be processed
                let processedVideos = 0; // Counter for processed videos
                for (let i = selectedResolutionIndex; i >= 0; i--) {
                    const [res, config] = sortedResolutions[i];
                    const outputDir = config.outputDir;
                    fs_1.default.mkdirSync(outputDir, { recursive: true }); // Create the directory if it does not exist
                    const outputFilename = `${uniqueId}.mp4`;
                    const outputPath = path_1.default.join(outputDir, outputFilename);
                    // Add the task to the queue
                    VideoQueue.push({
                        filePath,
                        resolutionConfig: config,
                        outputPath,
                        res,
                        io,
                        totalVideos,
                        processedVideos,
                        uniqueId,
                    });
                }
                resolve(bigestResolution); // Resolve the promise when all tasks are added to the queue
            }
            else {
                console.error('No video stream found in file');
                reject(new Error('No video stream found in file'));
            }
        });
    });
}
function handleFileUpload(req, res, VideoQueue, io) {
    return __awaiter(this, void 0, void 0, function* () {
        // req.file is the `video` file
        // req.body will hold the text fields, if there were any
        if (!req.user) {
            return res.status(401).send('Unauthorized: No user information provided');
        }
        // Access the user's email from the request object
        const userEmail = req.user.email;
        // console.log("User's email:", userEmail);
        console.log('Uploading video:', req.file);
        if (!req.file) {
            res.status(400).send('No file uploaded');
            return;
        }
        const { path: filePath, filename } = req.file;
        if (!fs_1.default.existsSync(filePath)) {
            // If the file doesn't exist, handle the error
            // For example, you can send a response to the client
            res.status(404).send('Video file not found');
            // Or you can create the file
            // fs.writeFileSync(filePath, '');
            return;
        }
        // Define the output directories for each resolution
        function makeResoltuionConfig(resolution, bitrate, width, outputDir) {
            let dataObject = {};
            for (let i = 0; i < resolution.length; i++) {
                dataObject[resolution[i]] = {
                    bitrate: bitrate[i],
                    width: width[i],
                    outputDir: outputDir[i],
                };
            }
            return dataObject;
        }
        const videoDir = path_1.default.join(__dirname, '../../video/');
        const resolutionConfig = makeResoltuionConfig(['144p', '240p', '480p', '720p', '1080p', '4k'], ['1000k', '1500k', '2500k', '5000k', '8000k', '35000k'], ['256', '426', '854', '1280', '1920', '3840'], [
            path_1.default.join(videoDir, '144p/'),
            path_1.default.join(videoDir, '240p/'),
            path_1.default.join(videoDir, '480p/'),
            path_1.default.join(videoDir, '720p/'),
            path_1.default.join(videoDir, '1080p/'),
            path_1.default.join(videoDir, '4k/'),
        ]);
        const uniqueId = (0, uuid_1.v4)();
        let bigestResolution = '0p';
        try {
            bigestResolution = yield processVideo(filePath, resolutionConfig, VideoQueue, io, uniqueId);
        }
        catch (error) {
            res.status(500).send('Error processing video');
            return;
        }
        const videoPath = req.file.path;
        generateThumbnail(videoPath, uniqueId);
        if (!req.file) {
            res.status(400).send('No file uploaded');
            return;
        }
        const file = req.file;
        // GMT+7
        const currentTime = new Date();
        const timeGMT7 = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
        const timeUpload = new Date(currentTime.getTime() + timeGMT7).toISOString();
        // thumbnail video
        const thumbnailFilename = `${uniqueId}.png`; // Update thumbnail filename
        // fs.writeFileSync('data.txt', JSON.stringify(data));
        let user = yield prisma.users.findFirst({
            where: {
                email: userEmail,
            },
        });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }
        const data = {
            // id: 0, // You'll need to generate or fetch this
            title: file.originalname,
            channel: user.username,
            description: '',
            img: thumbnailFilename,
            slug: uniqueId,
            quality: bigestResolution,
            duration: 100000,
            view: 0,
            likes: 0,
            timeUpload: timeUpload,
            filename: file.filename,
            path: file.path,
            size: file.size,
        };
        yield prisma.videos.create({
            data: {
                title_video: data.title,
                description: data.description,
                channel: data.channel,
                thumbnail: data.img,
                slug: data.slug,
                quality: data.quality,
                views: data.view,
                likes: data.likes,
                created_at: data.timeUpload,
                id_user: user.id_user,
            },
        });
        res.status(200).json({
            status: 'success',
            message: 'Video created successfully',
            data,
        });
    });
}
exports.handleFileUpload = handleFileUpload;
function handleTitleAndDescVideo(req, res, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const { title, description, slug } = req.body;
        console.log('title', title, 'description', description, 'slug');
        // res.status(200).send('OK');
        try {
            const pushVideo = yield prisma.videos.update({
                where: {
                    slug: slug,
                },
                data: {
                    title_video: title,
                    description: description,
                },
            });
            res.status(200).json({
                status: 'success',
                message: 'Video created successfully',
                data: pushVideo,
            });
        }
        catch (error) {
            res.status(200).json({
                status: 'error',
                message: error,
            });
        }
    });
}
exports.handleTitleAndDescVideo = handleTitleAndDescVideo;
