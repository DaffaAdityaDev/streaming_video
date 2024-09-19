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
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const openapi_json_1 = __importDefault(require("./api/openapi.json"));
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const enviroment_1 = require("./config/enviroment");
const userRoutes_1 = __importDefault(require("./routes/v1/userRoutes"));
const commentRoutes_1 = __importDefault(require("./routes/v1/commentRoutes"));
const videoRoutes_1 = __importDefault(require("./routes/v1/videoRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
const database_1 = require("./config/database");
const APP = (0, express_1.default)();
const server = http_1.default.createServer(APP);
APP.use(errorMiddleware_1.errorHandler);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
    },
});
// const videoQueue = MakeVideoQueue(4);
io.on('connection', (socket) => {
    let user = null;
    socket.on('disconnect', () => {
        console.log('user disconnected');
        user = null;
    });
});
APP.set('io', io);
APP.use(express_1.default.json());
APP.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});
APP.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify any additional headers you want to allow
}));
APP.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(openapi_json_1.default));
APP.use('/profileimages', express_1.default.static(path_1.default.join(__dirname, '../profileImages')));
APP.get('/', (req, res) => {
    res.send('Hello, Developer! start you CRAFT here');
});
APP.use('/api', userRoutes_1.default);
APP.use('/api', commentRoutes_1.default);
APP.use('/api', videoRoutes_1.default);
APP.listen(enviroment_1.config.port, () => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Server listening on ${enviroment_1.config.url}:${enviroment_1.config.port}`);
    yield (0, database_1.checkDatabaseConnection)();
}));
server.listen(enviroment_1.config.webSocketPort, () => {
    console.log(`Web Socket IO listening on ${enviroment_1.config.url}:${enviroment_1.config.webSocketPort}`);
});
