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
import { errorHandler, notFoundHandler } from './middlewares/errorMiddleware';
import { config } from 'dotenv';

const logger = createLogger('server');

// Global error handlers (unchanged)
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
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowUpgrades: true,
  perMessageDeflate: {
    threshold: 2048, // Size in bytes to compress data
  },
  maxHttpBufferSize: 1e8, // 100 MB
});

// Graceful shutdown function (unchanged)
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

// Combine CORS middleware
APP.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
}));

// Lazy load Swagger documentation
APP.use('/api-docs', (req, res, next) => {
  swaggerUi.setup(openApiJSON)(req, res, next);
});

// Static file serving (unchanged)
APP.use('/profileimages', express.static(path.join(__dirname, '../profileImages')));

// Async handler wrapper (unchanged)
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Routes (unchanged)
APP.get('/', asyncHandler(async (req: Request, res: Response) => {
  res.send('Hello, Developer! start your CRAFT here');
}));

APP.use('/api', userRoutes);
APP.use('/api', commentRoutes);
APP.use('/api', videoRoutes);

// Error handling middleware (unchanged)
APP.use(errorHandler);

APP.use((req: Request, res: Response, next: NextFunction) => {
  console.log('404 Not Found:', req.method, req.url);
  const error = new AppError('Not Found', 404);
  next(error);
});

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

  try {
    // Start server immediately
    server.listen(config.port, () => {
      logger.info(`HTTP server listening on ${config.url}:${config.port}`);
    });
    io.listen(config.webSocketPort);
    logger.info(`WebSocket server listening on ${config.url}:${config.webSocketPort}`);

    // Check database connection in the background
    checkDatabaseConnection().catch(error => {
      logger.error('Database connection failed:', error);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown handlers (unchanged)
process.on('SIGTERM', () => gracefulShutdown(server));
process.on('SIGINT', () => gracefulShutdown(server));
