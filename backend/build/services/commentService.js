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
const commentRepository_1 = __importDefault(require("../repository/commentRepository"));
const userRepository_1 = __importDefault(require("../repository/userRepository"));
const createComment = (body, id_video, email) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userRepository_1.default.findByEmail(email);
    if (!user) {
        throw new Error('User not found');
    }
    return commentRepository_1.default.create(body, id_video, user.id_user);
});
const getComments = (id_video) => __awaiter(void 0, void 0, void 0, function* () {
    return commentRepository_1.default.findByVideoId(id_video);
});
const updateComment = (id_comment, body) => __awaiter(void 0, void 0, void 0, function* () {
    return commentRepository_1.default.update(id_comment, body);
});
const deleteComment = (id_comment) => __awaiter(void 0, void 0, void 0, function* () {
    return commentRepository_1.default.deleteComment(id_comment);
});
exports.default = { createComment, getComments, updateComment, deleteComment };
