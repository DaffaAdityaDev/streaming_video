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
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const checkToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid or missing token format. Please provide a valid Bearer token.',
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined in the environment variables.');
        }
        // Verify the token and extract the user's email
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET); // Assert the type here
        const userEmail = decoded.email;
        // Find the user by email to get their id_user
        const user = yield prisma.users.findUnique({
            where: {
                email: userEmail,
            },
        });
        if (user) {
            // Attach the user's email to the request object
            req.user = { email: userEmail };
            next();
            console.log('User found:', user);
        }
        else {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token',
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Internal server error',
        });
    }
});
exports.default = checkToken;
