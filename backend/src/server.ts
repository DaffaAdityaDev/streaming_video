import express, { Request, Response } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import openApiJSON from './api/openapi.json';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { config } from './config/enviroment';
import userRoutes from './routes/v1/userRoutes';
import commentRoutes from './routes/v1/commentRoutes';
import videoRoutes from './routes/v1/videoRoutes';
import { errorHandler } from './middlewares/errorMiddleware';
import { checkDatabaseConnection } from './config/database';

const APP = express();
const server = http.createServer(APP);

APP.use(errorHandler);

const io = new Server(server, {
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

APP.use(express.json());
APP.use((req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization',
  );
  next();
});
APP.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the methods you want to allow
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify any additional headers you want to allow
  }),
);

APP.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiJSON));
APP.use('/profileimages', express.static(path.join(__dirname, '../profileImages')));

APP.get('/', (req: Request, res: Response) => {
  res.send('Hello, Developer! start you CRAFT here');
});

APP.use('/api', userRoutes);
APP.use('/api', commentRoutes);
APP.use('/api', videoRoutes);

APP.listen(config.port, async () => {
  console.log(`Server listening on ${config.url}:${config.port}`);
  await checkDatabaseConnection();
});

server.listen(config.webSocketPort, () => {
  console.log(`Web Socket IO listening on ${config.url}:${config.webSocketPort}`);
});
