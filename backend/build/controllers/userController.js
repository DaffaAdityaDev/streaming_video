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
exports.uploadProfileImage = exports.loginUser = exports.registerUser = void 0;
const userService_1 = __importDefault(require("../services/userService"));
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password } = req.body;
        const user = yield userService_1.default.registerUser(username, email, password);
        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
            data: user,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(error.message === 'User already exists' ? 409 : 500).json({
                status: 'error',
                message: error.message,
            });
        }
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const result = yield userService_1.default.loginUser(email, password);
        res.status(200).json(result);
    }
    catch (error) {
        if (error instanceof Error) {
            res.status(error.message === 'Invalid credentials' ? 401 : 500).json({
                status: 'error',
                message: error.message,
            });
        }
    }
});
exports.loginUser = loginUser;
const uploadProfileImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username } = req.body;
        const file = req.file;
        if (!file) {
            return res.status(400).json({
                status: 'error',
                message: 'No file uploaded',
            });
        }
        const user = yield userService_1.default.updateProfileImage(username, file);
        res.status(200).json({
            status: 'success',
            message: 'Image uploaded successfully',
            data: user,
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
exports.uploadProfileImage = uploadProfileImage;
