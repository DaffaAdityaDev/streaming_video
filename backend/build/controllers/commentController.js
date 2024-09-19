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
exports.deleteComment = exports.updateComment = exports.getComments = exports.createComment = void 0;
const commentService_1 = __importDefault(require("../services/commentService"));
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body, id_video, email } = req.body;
        const comment = yield commentService_1.default.createComment(body, id_video, email);
        res.status(201).json({
            status: 'success',
            data: comment,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(error.message === 'User not found' ? 404 : 500).json({
                status: 'error',
                message: error.message,
            });
        }
    }
});
exports.createComment = createComment;
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_video } = req.params;
        const comments = yield commentService_1.default.getComments(parseInt(id_video));
        res.status(200).json({
            status: 'success',
            data: comments,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error fetching comments',
        });
    }
});
exports.getComments = getComments;
const updateComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_comment } = req.params;
        const { body } = req.body;
        const comment = yield commentService_1.default.updateComment(parseInt(id_comment), body);
        res.status(200).json({
            status: 'success',
            data: comment,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error updating comment',
        });
    }
});
exports.updateComment = updateComment;
const deleteComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id_comment } = req.params;
        const comment = yield commentService_1.default.deleteComment(parseInt(id_comment));
        res.status(200).json({
            status: 'success',
            data: comment,
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error deleting comment',
        });
    }
});
exports.deleteComment = deleteComment;
