

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { createLogger } from '../utils/logger';

const logger = createLogger('errorMiddleware');

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError('Not Found', 404);
  next(error);
};

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
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
};