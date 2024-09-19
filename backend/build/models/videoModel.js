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
exports.getThumbnailByVideoId = exports.updateVideo = exports.createVideo = exports.findVideoBySlug = void 0;
const database_1 = __importDefault(require("../config/database"));
const findVideoBySlug = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.videos.findUnique({ where: { slug } });
});
exports.findVideoBySlug = findVideoBySlug;
const createVideo = (videoData) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.videos.create({ data: videoData });
});
exports.createVideo = createVideo;
const updateVideo = (slug, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.videos.update({ where: { slug }, data });
});
exports.updateVideo = updateVideo;
const getThumbnailByVideoId = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    const video = yield database_1.default.videos.findUnique({ where: { slug: videoId } });
    return video ? video.thumbnail : null;
});
exports.getThumbnailByVideoId = getThumbnailByVideoId;
