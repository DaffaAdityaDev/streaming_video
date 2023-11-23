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
const express_1 = __importDefault(require("express"));
const utils_1 = require("./utils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffprobe_1 = __importDefault(require("@ffprobe-installer/ffprobe"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.default.path);
const access = (0, utils_1.promisify)(fs_1.default.access);
const PORT = process.env.PORT;
const APP = (0, express_1.default)();
APP.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const dir = path_1.default.join(__dirname, '../video/defaultQuality/');
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
APP.get('/', (req, res) => {
    res.send('Hello, Developer! start you CRAFT here');
});
// segment video streaming
APP.get('/video/:quality/:slug/:segment', (req, res) => {
    const { quality, slug, segment } = req.params;
    // Validate quality and segment
    if (!['1080p', '720p', '480p', '360p', '240p'].includes(quality)) {
        return res.status(400).send('Invalid quality parameter');
    }
    if (isNaN(Number(segment))) {
        return res.status(400).send('Invalid segment parameter');
    }
    const videoPath = `video/${quality}/${slug}.mp4`;
    if (!fs_1.default.existsSync(videoPath)) {
        return res.status(404).send('Video file not found');
    }
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
APP.get('/video/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const CHUNK_SIZE = 520 * 1024; // 520kb
    console.log(req.query.slug);
    const slug = req.query.slug || req.params[0];
    const videoPath = `video/${slug}.mp4`;
    try {
        yield access(videoPath);
    }
    catch (_a) {
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
}));
// upload video
APP.post('/upload', upload.single('video'), (req, res) => {
    // req.file is the `video` file
    // req.body will hold the text fields, if there were any
    if (!req.file) {
        res.status(400).send('No file uploaded');
        return;
    }
    const { path: filePath, filename } = req.file;
    // Define the output directories for each resolution
    const resolutionConfig = {
        '480p': {
            width: '854',
            outputDir: path_1.default.join(__dirname, '../video/480p/')
        },
        '720p': {
            width: '1280',
            outputDir: path_1.default.join(__dirname, '../video/720p/')
        },
        '1080p': {
            width: '1920',
            outputDir: path_1.default.join(__dirname, '../video/1080p/')
        },
        '4k': {
            width: '3840',
            outputDir: path_1.default.join(__dirname, '../video/4k/')
        },
        // Add other resolutions as needed
    };
    fluent_ffmpeg_1.default.ffprobe(filePath, function (err, metadata) {
        if (err || !metadata) {
            console.error('Error reading video file:', err);
            return;
        }
        const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
        if (videoStream) {
            const videoWidth = videoStream.width;
            // Sort the resolutions from lowest to highest
            const sortedResolutions = Object.entries(resolutionConfig).sort((a, b) => {
                const widthA = parseInt(a[1].width);
                const widthB = parseInt(b[1].width);
                return widthA - widthB;
            });
            // Now you can use the resolution to select the correct output directory and frame size
            let selectedResolution;
            for (const [res, config] of sortedResolutions) {
                const frameWidth = parseInt(config.width);
                if (videoWidth && videoWidth <= frameWidth) {
                    selectedResolution = [res, config.outputDir];
                    break; // Exit the loop after finding the first matching resolution
                }
            }
            if (!selectedResolution) {
                selectedResolution = [sortedResolutions[sortedResolutions.length - 1][0], sortedResolutions[sortedResolutions.length - 1][1].outputDir]; // Select the highest available resolution if none matched
            }
            console.log('Selected resolution:', selectedResolution);
            const [res, outputDir] = selectedResolution;
            fs_1.default.mkdirSync(outputDir, { recursive: true }); // Create the directory if it does not exist
            const outputPath = path_1.default.join(outputDir, filename);
            (0, fluent_ffmpeg_1.default)(filePath)
                .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
                .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
                .format('mp4')
                .outputOptions('-vf', `scale=${resolutionConfig[res].width}:-1`) // Set the width and calculate the height
                // Add other output options as needed, such as bitrate
                .output(outputPath)
                .on('start', function (commandLine) {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
                .on('error', function (err, stdout, stderr) {
                console.log('Error: ' + err.message);
                console.log('ffmpeg stdout: ' + stdout);
                console.log('ffmpeg stderr: ' + stderr);
            })
                .on('progress', function (progress) {
                console.log('Processing: ' + progress.percent.toFixed(2) + '% done');
            })
                .on('end', function () {
                console.log('Conversion Done');
            })
                .run();
        }
        else {
            console.error('No video stream found in file');
        }
    });
    const videoPath = req.file.path;
    (0, utils_1.generateThumbnail)(videoPath);
    res.send('Video uploaded successfully.');
});
APP.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
