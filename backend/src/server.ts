import express, { Request, Response, NextFunction } from 'express';
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
import { errorHandler, AppError } from './utils/AppError';
import { checkDatabaseConnection } from './config/database';

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const APP = express();
const server = http.createServer(APP);

APP.use(express.json());

const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// Graceful shutdown function
const gracefulShutdown = (server: http.Server) => {
  console.log('Received kill signal, shutting down gracefully');
  server.close(() => {
    console.log('Closed out remaining connections');
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

io.on('connection', (socket) => {
  let user = null;
  socket.on('disconnect', () => {
    console.log('user disconnected');
    user = null;
  });
});

APP.set('io', io);

// CORS middleware
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

// Swagger documentation
APP.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiJSON));

// Static file serving
APP.use('/profileimages', express.static(path.join(__dirname, '../profileImages')));

// Async handler wrapper
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes
APP.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.send('Hello, Developer! start your CRAFT here');
}));

APP.use('/api', userRoutes);
APP.use('/api', commentRoutes);
APP.use('/api', videoRoutes);

// Error handling middleware (should be last)
APP.use(errorHandler);

// 
APP.use((req: Request, res: Response, next: NextFunction) => {
  console.log('404 Not Found:', req.method, req.url);
  const error = new AppError('Not Found', 404);
  next(error);
});

// This should be at the end of your middleware chain in server.ts
APP.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error caught in final error handler:', err);
  console.error('Request method:', req.method);
  console.error('Request URL:', req.url);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message,
    method: req.method,
    url: req.url
  });
});

// Start the server
const startServer = async () => {
  try {
    await checkDatabaseConnection();
    server.listen(config.port, () => {
      console.log(`Server listening on ${config.url}:${config.port}`);
      console.log(`WebSocket server listening on ${config.url}:${config.webSocketPort}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));