"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThumbnail = exports.promisify = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
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
function generateThumbnail(videoPath) {
    console.log('Generating thumbnail for', videoPath);
    const thumbnailPath = path_1.default.join(__dirname, '../../thumbnails');
    // Create the thumbnails directory if it does not exist
    if (!fs_1.default.existsSync(thumbnailPath)) {
        fs_1.default.mkdirSync(thumbnailPath, { recursive: true });
    }
    // Extract the video name and append '-thumbnail' to it
    const videoName = path_1.default.basename(videoPath, path_1.default.extname(videoPath));
    const thumbnailName = `${videoName}-thumbnail.png`;
    (0, fluent_ffmpeg_1.default)(videoPath)
        .screenshots({
        timestamps: [10],
        filename: thumbnailName,
        folder: thumbnailPath,
        size: '320x240'
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
