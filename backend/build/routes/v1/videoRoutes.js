"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const videoController_1 = require("../../controllers/videoController");
const express_1 = require("express");
const videoController_2 = require("../../controllers/videoController");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const validationMiddleware_1 = require("../../middlewares/validationMiddleware");
const fs_1 = __importDefault(require("fs"));
const express_2 = __importDefault(require("express"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            const dir = path_1.default.join(__dirname, '../../../video/uploads/');
            fs_1.default.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            cb(null, Date.now() + path_1.default.extname(file.originalname));
        }
    }),
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type. Only video files are allowed.'));
        }
    }
});
// Version 1 routes
const v1Router = (0, express_1.Router)();
v1Router.get('/', videoController_2.getAllVideos);
v1Router.use('/thumbnail', express_2.default.static(path_1.default.join(__dirname, '../../../thumbnails')));
v1Router.post('/upload', authMiddleware_1.default, upload.single('video'), validationMiddleware_1.validateVideoUpload, validationMiddleware_1.validate, videoController_2.uploadVideo);
v1Router.put('/:slug', authMiddleware_1.default, validationMiddleware_1.validateVideoUpdate, validationMiddleware_1.validate, videoController_2.updateVideo);
v1Router.get('/user/:email', videoController_1.getVideosByUserEmail);
v1Router.get('/thumbnail/:videoId', videoController_1.getThumbnail);
v1Router.get('/stream/:quality/:slug', videoController_2.streamVideo); // Changed to include '/stream' prefix
v1Router.get('/list-files', (req, res) => {
    const videoDir = path_1.default.join(__dirname, '../../../video/');
    const files = fs_1.default.readdirSync(videoDir, { withFileTypes: true });
    const fileStructure = files.map(file => {
        if (file.isDirectory()) {
            const subDir = path_1.default.join(videoDir, file.name);
            const subFiles = fs_1.default.readdirSync(subDir);
            return { [file.name]: subFiles };
        }
        return file.name;
    });
    res.json(fileStructure);
});
// Apply v1 routes to the main router
router.use('/v1/video', v1Router);
exports.default = router;
