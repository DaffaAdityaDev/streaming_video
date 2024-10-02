import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import openApiJSON from './api/openapi.json';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import { getConfig } from './config/environment';
import userRoutes from './routes/v1/userRoutes';
import commentRoutes from './routes/v1/commentRoutes';
import videoRoutes from './routes/v1/videoRoutes';
import { AppError } from './utils/AppError';
import { checkDatabaseConnection } from './config/database';
import { createLogger } from './utils/logger';
import { setupRoutes } from './routes/setupRoutes';
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware';
import { setupGracefulShutdown } from './utils/gracefulShutdown';
import { config } from 'dotenv';

const logger = createLogger('server');

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logger.error(`Unhandled Rejection at: ${promise} reason: ${reason}`);
  process.exit(1);
});

const APP = express();
const server = http.createServer(APP);

APP.use(express.json());
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Graceful shutdown function
const gracefulShutdown = (server: http.Server) => {
  logger.info('Received kill signal, shutting down gracefully');
  server.close(() => {
    logger.info('Closed out remaining connections');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
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
  logger.error(`Error caught in final error handler: ${err.message}`, {
    statusCode: err.statusCode,
    stack: err.stack,
    method: req.method,
    url: req.url
  });
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message,
    method: req.method,
    url: req.url
  });
});

// Start the server
const startServer = async () => {
  const config = getConfig();
  logger.debug('Starting server...');
  logger.info(`Current timezone: ${config.timezone}`);
  // logger.error('Test error log');
  // logger.warn('Test warn log');
  // logger.info('Test info log');
  // logger.http('Test http log');
  // logger.verbose('Test verbose log');
  // logger.debug('Test debug log');
  // logger.silly('Test silly log');
  try {
    await checkDatabaseConnection();
    server.listen(config.port, () => {
      logger.info(`HTTP server listening on ${config.url}:${config.port}`);
    });
    io.listen(config.webSocketPort);
    logger.info(`WebSocket server listening on ${config.url}:${config.webSocketPort}`);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));
