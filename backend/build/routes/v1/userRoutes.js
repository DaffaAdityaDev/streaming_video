"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../../controllers/userController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const validationMiddleware_1 = require("../../middlewares/validationMiddleware");
const router = (0, express_1.Router)();
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../profileImages/'));
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({ storage });
// Version 1 routes
const v1Router = (0, express_1.Router)();
v1Router.post('/register', validationMiddleware_1.validateRegistration, validationMiddleware_1.validate, userController_1.registerUser);
v1Router.post('/login', validationMiddleware_1.validateLogin, validationMiddleware_1.validate, userController_1.loginUser);
v1Router.post('/upload-profile', upload.single('image'), userController_1.uploadProfileImage);
// Apply v1 routes to the main router
router.use('/v1/user', v1Router);
exports.default = router;
