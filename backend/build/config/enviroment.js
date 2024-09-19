"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    url: process.env.URL || 'http://localhost',
    port: process.env.PORT || 3001,
    webSocketPort: process.env.WEBSOCKET_PORT || 3002,
    jwtSecret: process.env.JWT_SECRET || 'defaultSecret',
    databaseUrl: process.env.DATABASE_URL,
};
