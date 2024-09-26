import winston from 'winston';
import dotenv from 'dotenv';
import moment from 'moment-timezone';
import { config } from '../config/enviroment';

dotenv.config();

// Define custom log levels
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    verbose: 'cyan',
    debug: 'blue',
    silly: 'gray'
  }
};

// Create a custom format
const customFormat = winston.format.printf(({ level, message, timestamp, namespace, ...metadata }) => {
  let msg = `${timestamp} [${level}]${namespace ? ` [${namespace}]` : ''} : ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

// Function to determine the active log levels based on environment variables
const getActiveLevels = () => {
  const logLevel = process.env.LOG_LEVEL || 'debug';
  // Remove this line:
  // console.log('Current LOG_LEVEL:', logLevel);
  return Object.keys(customLevels.levels);
};

// Create the base logger
const createBaseLogger = () => {
  const logLevel = process.env.LOG_LEVEL || 'debug';
  console.log('Creating logger with level:', logLevel);
  
  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: logLevel,
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({
          format: () => {
            return moment().tz(config.timezone).format('YYYY-MM-DD HH:mm:ss.SSS Z');
          }
        }),
        customFormat
      )
    })
  ];

  const env = process.env.NODE_ENV || 'development';
  if (env === 'production') {
    transports.push(
      new winston.transports.File({ 
        filename: 'error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'combined.log',
        level: logLevel
      })
    );
  }

  return winston.createLogger({
    levels: customLevels.levels,
    level: logLevel,
    format: winston.format.combine(
      winston.format.timestamp({
        format: () => {
          return moment().tz(config.timezone).format('YYYY-MM-DD HH:mm:ss.SSS Z');
        }
      }),
      winston.format.colorize(),
      customFormat
    ),
    transports: transports,
  });
};

// Add colors to Winston
winston.addColors(customLevels.colors);

// Create the base logger
const baseLogger = createBaseLogger();

// Function to create namespace loggers
export const createLogger = (namespace: string) => {
  const activeLevels = getActiveLevels();
  const logger: Record<string, (message: string, meta?: any) => void> = {};

  Object.keys(customLevels.levels).forEach(level => {
    logger[level] = (message: string, meta?: any) => {
      if (activeLevels.includes(level)) {
        (baseLogger as any)[level]({ message, namespace, ...meta });
      }
    };
  });

  return logger;
};

// Export a default logger for general use
export const logger = createLogger('app');

// Function to dynamically update log levels
export const updateLogLevels = (newLevel: string) => {
  process.env.LOG_LEVEL = newLevel;
  const updatedLogger = createBaseLogger();
  Object.assign(baseLogger, updatedLogger);
};