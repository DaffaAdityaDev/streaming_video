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
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRepository_1 = __importDefault(require("../repository/userRepository"));
const enviroment_1 = require("../config/enviroment");
const registerUser = (username, email, password) => __awaiter(void 0, void 0, void 0, function* () {
    if (!username || !email || !password) {
        throw new Error('Please fill in all fields');
    }
    const existingUser = yield userRepository_1.default.findByEmail(email);
    if (existingUser) {
        throw new Error('User already exists');
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, 10);
    const user = yield userRepository_1.default.create({
        username,
        email,
        password: hashedPassword,
        image_url: 'https://res.cloudinary.com/dkkgmzpqd/image/upload/v1628074759/default-profile-picture-300x300_y3c5xw.png',
    });
    return { username: user.username, email: user.email };
});
const loginUser = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield userRepository_1.default.findByEmail(email);
    if (!user) {
        throw new Error('Invalid credentials');
    }
    const passwordValid = yield bcrypt_1.default.compare(password, user.password);
    if (!passwordValid) {
        throw new Error('Invalid credentials');
    }
    const token = jsonwebtoken_1.default.sign({ email }, enviroment_1.config.jwtSecret, { expiresIn: '7d' });
    yield userRepository_1.default.update(email, { token });
    return {
        status: 'success',
        message: 'User logged in successfully',
        token,
        username: user.username,
        email: user.email,
        image_url: user.image_url,
    };
});
const updateProfileImage = (username, file) => __awaiter(void 0, void 0, void 0, function* () {
    const imageId = file.filename;
    const user = yield userRepository_1.default.updateByUsername(username, { image_url: imageId });
    if (!user) {
        throw new Error('User not found');
    }
    return user;
});
exports.default = { registerUser, loginUser, updateProfileImage };
