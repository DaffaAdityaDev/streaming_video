"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThumbnail = exports.promisify = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const path_1 = __importDefault(require("path"));
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
    const thumbnailPath = path_1.default.join(__dirname, '../../thumbnails');
    (0, fluent_ffmpeg_1.default)(videoPath)
        .screenshots({
        timestamps: ['10%'],
        filename: 'thumbnail.png',
        folder: thumbnailPath,
        size: '320x240'
    });
}
exports.generateThumbnail = generateThumbnail;
