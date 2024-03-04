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
const checkToken_1 = __importDefault(require("./utils/checkToken"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffprobe_1 = __importDefault(require("@ffprobe-installer/ffprobe"));
const ffmpeg_1 = __importDefault(require("@ffmpeg-installer/ffmpeg"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openapi_json_1 = __importDefault(require("./api/openapi.json"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const prisma = new client_1.PrismaClient();
fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_1.default.path);
fluent_ffmpeg_1.default.setFfprobePath(ffprobe_1.default.path);
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
// console.log(process.env.PORT);
const APP = (0, express_1.default)();
const server = http_1.default.createServer(APP);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
const videoQueue = (0, utils_1.MakeVideoQueue)(4);
io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
APP.use(express_1.default.json());
APP.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});
APP.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify any additional headers you want to allow
}));
APP.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_json_1.default));
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const dir = path_1.default.join(__dirname, '../video/defaultQuality/');
        // Create the directory if it doesn't exist
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage: storage });
APP.use('/video', express_1.default.static('video'));
APP.use('/thumbnails', express_1.default.static('thumbnails'));
APP.get('/', (req, res) => {
    res.send('Hello, Developer! start you CRAFT here');
});
APP.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, email, password } = req.body;
    console.log(username);
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    if (!username || !email || !password) {
        return res.status(200).json({
            status: 'error',
            message: 'Please fill in all fields',
        });
    }
    try {
        const checkUser = yield prisma.users.findFirst({
            where: {
                OR: [{ username: username }, { email: email }],
            },
        });
        if (checkUser) {
            return res.status(200).json({
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
        res.status(200).json({
            status: 'error',
            message: error,
        });
    }
}));
APP.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error no Token Generated',
        });
    }
    const token = jsonwebtoken_1.default.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: '7d',
    });
    try {
        const user = yield prisma.users.findUnique({
            where: {
                email,
            },
        });
        if (!user) {
            return res.status(203).json({
                status: 'error',
                message: 'User not found',
            });
        }
        const passwordValid = yield bcrypt_1.default.compare(password, user.password);
        if (!passwordValid) {
            return res.status(203).json({
                status: 'error',
                message: 'Invalid password',
            });
        }
        yield prisma.users.update({
            where: {
                email,
            },
            data: {
                token,
            },
        });
        return res.json({
            status: 'success',
            message: 'User logged in successfully',
            token,
            username: user.username,
            email: user.email,
            image_url: user.image_url,
        });
    }
    catch (error) {
        res.status(400).json({
            status: 'error',
            message: error,
        });
    }
}));
// experimental not working
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
    const slug = req.query.slug || req.params[0];
    yield (0, utils_1.streamVideoFile)(req, res, slug);
}));
// get all videos
APP.get('/videos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const videos = yield prisma.videos.findMany({
        orderBy: {
            created_at: 'desc',
        },
    });
    res.json(videos);
}));
// get specific user video
APP.post('/videos', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        // Find the user by email to get their id_user
        const user = yield prisma.users.findUnique({
            where: {
                email: email,
            },
        });
        console.log(user);
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }
        // Fetch videos for the specific user using their id_user
        const videos = yield prisma.videos.findMany({
            where: {
                id_user: user.id_user,
            },
            include: {
                user: true, // Include user details in the response
            },
        });
        res.status(200).json({
            status: 'success',
            data: videos,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message,
        });
    }
}));
APP.get('/thumbnail/:slug', (req, res) => {
    const { slug } = req.params;
    const thumbnailPath = path_1.default.join(__dirname, `../thumbnails/${slug}.png`);
    console.log(thumbnailPath);
    if (!fs_1.default.existsSync(thumbnailPath)) {
        return res.status(404).send('Thumbnail not found');
    }
    res.sendFile(thumbnailPath);
});
// upload video
APP.post('/upload', checkToken_1.default, upload.single('video'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, utils_1.handleFileUpload)(req, res, videoQueue, io);
}));
APP.post('/upload', checkToken_1.default, upload.single('video'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, utils_1.handleFileUpload)(req, res, videoQueue, io);
}));
// upload title and description
APP.post('/upload/title', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, utils_1.handleTitleAndDescVideo)(req, res, videoQueue);
}));
// for comments CRUD
APP.post('/comments', checkToken_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { body, id_video, email } = req.body;
    try {
        // Find the user by email to get their id_user
        const user = yield prisma.users.findUnique({
            where: {
                email: email,
            },
        });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found',
            });
        }
        // Use the id_user from the found user to create the comment
        const comment = yield prisma.comments.create({
            data: {
                body,
                id_video,
                id_user: user.id_user,
            },
        });
        res.status(201).json({
            status: 'success',
            data: comment,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error creating comment' });
    }
}));
APP.get('/comments/:id_video', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_video } = req.params;
    try {
        const comments = yield prisma.comments.findMany({
            where: { id_video: parseInt(id_video) },
            include: { user: true },
        });
        res.status(200).json({
            status: 'success',
            data: comments,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching comments' });
    }
}));
APP.put('/comments/:id_comment', checkToken_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_comment } = req.params;
    const { body } = req.body;
    try {
        const comment = yield prisma.comments.update({
            where: { id_comment: parseInt(id_comment) },
            data: { body },
        });
        res.status(200).json({
            status: 'success',
            data: comment,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error updating comment' });
    }
}));
APP.delete('/comments/:id_comment', checkToken_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_comment } = req.params;
    try {
        const comment = yield prisma.comments.delete({
            where: { id_comment: parseInt(id_comment) },
        });
        res.status(200).json({
            status: 'success',
            data: comment,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting comment' });
    }
}));
APP.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
server.listen(8001, () => {
    console.log('listening on *:8001');
});
