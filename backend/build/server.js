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
const bcrypt_1 = __importDefault(require("bcrypt"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const async_1 = __importDefault(require("async"));
const async_1 = __importDefault(require("async"));
const prisma = new client_1.PrismaClient();
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.default.path);
const access = (0, utils_1.promisify)(fs_1.default.access);
const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT || 3001;
const APP = (0, express_1.default)();
APP.use(express_1.default.json());
APP.use(express_1.default.json());
APP.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
/**
 * The storage configuration for multer.
 *
 * This configuration specifies where and how uploaded files should be stored.
 *
 * @type {multer.StorageEngine}
 *
 * @property {Function} destination - A function to control where uploaded files should be stored.
 * @property {Function} filename - A function to control what the uploaded file should be named.
 */
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const dir = path_1.default.join(__dirname, '../video/defaultQuality/');
        // Create the directory if it doesn't exist
        fs_1.default.mkdirSync(dir, { recursive: true });
        // Create the directory if it doesn't exist
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({ storage: storage });
APP.use('/video', express_1.default.static('video'));
APP.use('/thumbnails', express_1.default.static('thumbnails'));
APP.use('/video', express_1.default.static('video'));
APP.use('/thumbnails', express_1.default.static('thumbnails'));
APP.get('/', (req, res) => {
    res.send('Hello, Developer! start you CRAFT here');
});
APP.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    try {
        const checkUser = yield prisma.users.findFirst({
            where: {
                OR: [
                    { username: username },
                    { email: email },
                ],
            },
        });
        if (checkUser) {
            return res.status(400).json({
                status: 'error',
                message: 'User already exists',
            });
        }
        const user = yield prisma.users.create({
            data: {
                username,
                email,
                password: hashedPassword,
                image_url: 'https://res.cloudinary.com/dkkgmzpqd/image/upload/v1628074759/default-profile-picture-300x300_y3c5xw.png',
            },
        });
        return res.json({
            status: 'success',
            message: 'User created successfully',
            data: user,
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: error,
        });
    }
}));
APP.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    try {
        const user = yield prisma.users.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }
        const passwordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!passwordValid) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid password',
            });
        }
        return res.json({
            status: 'success',
            message: 'User logged in successfully',
            data: user,
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: error,
        });
    }
}));
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
// Create a queue object with concurrency 4
const q = async_1.default.queue((task, callback) => {
    (0, fluent_ffmpeg_1.default)(task.filePath)
        .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
        .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
        .format('mp4')
        .outputOptions('-vf', `scale=${task.resolutionConfig.width}:-1`) // Set the width and calculate the height
        .outputOptions('-b:v', task.resolutionConfig.bitrate) // Set the video bitrate
        .output(task.outputPath)
        .on('start', function (commandLine) {
        console.log(`[${task.res}] Spawned Ffmpeg with command: ${commandLine}`);
    })
        .on('error', function (err, stdout, stderr) {
        console.log(`[${task.res}] Error: ${err.message}`);
        console.log(`[${task.res}] ffmpeg stdout: ${stdout}`);
        console.log(`[${task.res}] ffmpeg stderr: ${stderr}`);
        callback(); // Call the callback function once the task is done
    })
        .on('progress', function (progress) {
        if (progress.percent) {
            console.log(`[${task.res}] Processing: ${progress.percent.toFixed(2)}% done`);
        }
    })
        .on('end', function () {
        console.log(`[${task.res}] Conversion Done`);
        callback(); // Call the callback function once the task is done
    })
        .run();
}, 4);
// upload video
// Create a queue object with concurrency 4
const q = async_1.default.queue((task, callback) => {
    (0, fluent_ffmpeg_1.default)(task.filePath)
        .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
        .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
        .format('mp4')
        .outputOptions('-vf', `scale=${task.resolutionConfig.width}:-1`) // Set the width and calculate the height
        .outputOptions('-b:v', task.resolutionConfig.bitrate) // Set the video bitrate
        .output(task.outputPath)
        .on('start', function (commandLine) {
        console.log(`[${task.res}] Spawned Ffmpeg with command: ${commandLine}`);
    })
        .on('error', function (err, stdout, stderr) {
        console.log(`[${task.res}] Error: ${err.message}`);
        console.log(`[${task.res}] ffmpeg stdout: ${stdout}`);
        console.log(`[${task.res}] ffmpeg stderr: ${stderr}`);
        callback(); // Call the callback function once the task is done
    })
        .on('progress', function (progress) {
        if (progress.percent) {
            console.log(`[${task.res}] Processing: ${progress.percent.toFixed(2)}% done`);
        }
    })
        .on('end', function () {
        console.log(`[${task.res}] Conversion Done`);
        callback(); // Call the callback function once the task is done
    })
        .run();
}, 4);
/**
 * Handles the POST request for the '/upload' route.
 *
 * This function is responsible for handling file uploads. It uses multer to process the uploaded file.
 * If no file is uploaded, it sends a 400 status code with a message 'No file uploaded'.
 * It then checks if the uploaded file exists in the file system. If not, it sends a 404 status code with a message 'Video file not found'.
 *
 * @param {express.Request} req - The request object.
 * @param {express.Response} res - The response object.
 * @returns {void}
 */
APP.post('/upload', upload.single('video'), (req, res) => {
    // req.file is the `video` file
    // req.body will hold the text fields, if there were any
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
    if (!fs_1.default.existsSync(filePath)) {
        // If the file doesn't exist, handle the error
        // For example, you can send a response to the client
        res.status(404).send('Video file not found');
        // Or you can create the file
        // fs.writeFileSync(filePath, '');
        return;
    }
    // Define the output directories for each resolution
    const resolutionConfig = {
        '144p': {
            width: '256',
            outputDir: path_1.default.join(__dirname, '../video/144p/'),
            bitrate: '1000k'
        },
        '240p': {
            width: '426',
            outputDir: path_1.default.join(__dirname, '../video/240p/'),
            bitrate: '1500k'
        },
        '144p': {
            width: '256',
            outputDir: path_1.default.join(__dirname, '../video/144p/'),
            bitrate: '1000k'
        },
        '240p': {
            width: '426',
            outputDir: path_1.default.join(__dirname, '../video/240p/'),
            bitrate: '1500k'
        },
        '480p': {
            width: '854',
            outputDir: path_1.default.join(__dirname, '../video/480p/'),
            bitrate: '2500k'
            outputDir: path_1.default.join(__dirname, '../video/480p/'),
            bitrate: '2500k'
        },
        '720p': {
            width: '1280',
            outputDir: path_1.default.join(__dirname, '../video/720p/'),
            bitrate: '5000k'
            outputDir: path_1.default.join(__dirname, '../video/720p/'),
            bitrate: '5000k'
        },
        '1080p': {
            width: '1920',
            outputDir: path_1.default.join(__dirname, '../video/1080p/'),
            bitrate: '8000k'
            outputDir: path_1.default.join(__dirname, '../video/1080p/'),
            bitrate: '8000k'
        },
        '4k': {
            width: '3840',
            outputDir: path_1.default.join(__dirname, '../video/4k/'),
            bitrate: '35000k'
            outputDir: path_1.default.join(__dirname, '../video/4k/'),
            bitrate: '35000k'
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
            let selectedResolution = ['', {}];
            let selectedResolution = ['', {}];
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
            const [res, outputDir] = selectedResolution;
            const selectedResolutionIndex = sortedResolutions.findIndex(([res]) => res === selectedResolution[0]);
            for (let i = selectedResolutionIndex; i >= 0; i--) {
                const [res, config] = sortedResolutions[i];
                const outputDir = config.outputDir;
                fs_1.default.mkdirSync(outputDir, { recursive: true }); // Create the directory if it does not exist
                const outputFilename = `${path_1.default.basename(filePath, path_1.default.extname(filePath))}-${res}.mp4`;
                const outputPath = path_1.default.join(outputDir, outputFilename);
                // Add the task to the queue
                q.push({
                    filePath,
                    resolutionConfig: config,
                    outputPath,
                    res
                });
                // ffmpeg(filePath)
                //   .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
                //   .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
                //   .format('mp4')
                //   .outputOptions('-vf', `scale=${resolutionConfig[res as keyof typeof resolutionConfig].width}:-1`) // Set the width and calculate the height
                //   .outputOptions('-b:v', resolutionConfig[res as keyof typeof resolutionConfig].bitrate) // Set the video bitrate
                //   .output(outputPath)
                //   .on('start', function(commandLine) {
                //     console.log(`[${res}] Spawned Ffmpeg with command: ${commandLine}`);
                //   })
                //   .on('error', function(err, stdout, stderr) {
                //     console.log(`[${res}] Error: ${err.message}`);
                //     console.log(`[${res}] ffmpeg stdout: ${stdout}`);
                //     console.log(`[${res}] ffmpeg stderr: ${stderr}`);
                //   })
                //   .on('progress', function(progress) {
                //     if (progress.percent) {
                //       console.log(`[${res}] Processing: ${progress.percent.toFixed(2)}% done`);
                //     }
                //   })
                //   .on('end', function() {
                //     console.log(`[${res}] Conversion Done`);
                //   })
                //   .run();
            }
            const selectedResolutionIndex = sortedResolutions.findIndex(([res]) => res === selectedResolution[0]);
            for (let i = selectedResolutionIndex; i >= 0; i--) {
                const [res, config] = sortedResolutions[i];
                const outputDir = config.outputDir;
                fs_1.default.mkdirSync(outputDir, { recursive: true }); // Create the directory if it does not exist
                const outputFilename = `${path_1.default.basename(filePath, path_1.default.extname(filePath))}-${res}.mp4`;
                const outputPath = path_1.default.join(outputDir, outputFilename);
                // Add the task to the queue
                q.push({
                    filePath,
                    resolutionConfig: config,
                    outputPath,
                    res
                });
                // ffmpeg(filePath)
                //   .inputOptions('-hwaccel auto') // Automatically select the hardware acceleration method
                //   .outputOptions('-c:v h264_nvenc') // Use NVENC for encoding if available
                //   .format('mp4')
                //   .outputOptions('-vf', `scale=${resolutionConfig[res as keyof typeof resolutionConfig].width}:-1`) // Set the width and calculate the height
                //   .outputOptions('-b:v', resolutionConfig[res as keyof typeof resolutionConfig].bitrate) // Set the video bitrate
                //   .output(outputPath)
                //   .on('start', function(commandLine) {
                //     console.log(`[${res}] Spawned Ffmpeg with command: ${commandLine}`);
                //   })
                //   .on('error', function(err, stdout, stderr) {
                //     console.log(`[${res}] Error: ${err.message}`);
                //     console.log(`[${res}] ffmpeg stdout: ${stdout}`);
                //     console.log(`[${res}] ffmpeg stderr: ${stderr}`);
                //   })
                //   .on('progress', function(progress) {
                //     if (progress.percent) {
                //       console.log(`[${res}] Processing: ${progress.percent.toFixed(2)}% done`);
                //     }
                //   })
                //   .on('end', function() {
                //     console.log(`[${res}] Conversion Done`);
                //   })
                //   .run();
            }
        }
        else {
            console.error('No video stream found in file');
        }
    });
    const videoPath = req.file.path;
    (0, utils_1.generateThumbnail)(videoPath);
    if (!req.file) {
        res.status(400).send('No file uploaded');
        return;
    }
    const file = req.file;
    const data = {
        id: 0,
        title: file.originalname,
        channel: 'Description',
        img: 'https://media.tenor.com/ZnP0C4JkNEYAAAAC/gojo-sukuna.gif',
        slug: file.filename,
        quality: '1080p',
        duration: 100000,
        view: 100000,
        timeUpload: new Date().toISOString(),
        filename: file.filename,
        path: file.path,
        size: file.size
    };
    fs_1.default.writeFileSync('data.txt', JSON.stringify(data));
    res.send('original Video uploaded successfully.');
});
APP.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
