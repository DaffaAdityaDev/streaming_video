// src/utils/gracefulShutdown.ts

import http from 'http';
import { createLogger } from './logger';

const logger = createLogger('gracefulShutdown');

export const setupGracefulShutdown = (server: http.Server): void => {
  const gracefulShutdown = (): void => {
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

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};