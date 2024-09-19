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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("../config/database"));
const findBySlug = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.videos.findUnique({ where: { slug } });
});
const create = (videoData, transaction) => __awaiter(void 0, void 0, void 0, function* () {
    const { id_user } = videoData, rest = __rest(videoData, ["id_user"]);
    const createData = Object.assign({}, rest);
    if (id_user !== undefined) {
        createData.user = { connect: { id_user } };
    }
    else {
        throw new Error('User ID is required to create a video');
    }
    const client = transaction || database_1.default;
    return client.videos.create({ data: createData });
});
const update = (slug, data) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.videos.update({ where: { slug }, data });
});
const findAll = (options) => __awaiter(void 0, void 0, void 0, function* () {
    return database_1.default.videos.findMany(options);
});
const findByUserEmail = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield database_1.default.users.findUnique({ where: { email } });
    if (!user) {
        throw new Error('User not found');
    }
    return database_1.default.videos.findMany({
        where: { id_user: user.id_user },
        orderBy: { created_at: 'desc' },
        include: { user: true }
    });
});
const getThumbnailByVideoId = (videoId) => __awaiter(void 0, void 0, void 0, function* () {
    const video = yield database_1.default.videos.findUnique({ where: { slug: videoId } });
    return video ? video.thumbnail : null;
});
const deleteBySlug = (slug) => __awaiter(void 0, void 0, void 0, function* () {
    yield database_1.default.videos.delete({ where: { slug } });
});
exports.default = { findBySlug, create, update, findAll, findByUserEmail, getThumbnailByVideoId };
