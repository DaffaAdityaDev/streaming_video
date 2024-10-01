// src/socket/socketSetup.ts

import { Server as SocketServer } from 'socket.io';
import { createLogger } from '../utils/logger';

const logger = createLogger('socketSetup');

export const setupSocketIO = (io: SocketServer): void => {
  io.on('connection', (socket) => {
    logger.info('New client connected');

    socket.on('disconnect', () => {
      logger.info('Client disconnected');
    });

    // Add more socket event handlers here
  });
};