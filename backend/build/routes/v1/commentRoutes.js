"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commentController_1 = require("../../controllers/commentController");
const authMiddleware_1 = __importDefault(require("../../middlewares/authMiddleware"));
const router = (0, express_1.Router)();
// Version 1 routes
const v1Router = (0, express_1.Router)();
v1Router.post('/', authMiddleware_1.default, commentController_1.createComment);
v1Router.get('/:id_video', commentController_1.getComments);
v1Router.put('/:id_comment', authMiddleware_1.default, commentController_1.updateComment);
v1Router.delete('/:id_comment', authMiddleware_1.default, commentController_1.deleteComment);
// Apply v1 routes to the main router
router.use('/v1/comment', v1Router);
exports.default = router;
