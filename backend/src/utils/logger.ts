import winston from 'winston';
import dotenv from 'dotenv';

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
  const env = process.env.NODE_ENV || 'development';
  const logLevel = process.env.LOG_LEVEL || 'info';
  
  const levelIndex = Object.keys(customLevels.levels).indexOf(logLevel);
  return Object.keys(customLevels.levels).slice(0, levelIndex + 1);
};

// Create the base logger
const createBaseLogger = () => {
  const activeLevels = getActiveLevels();
  const env = process.env.NODE_ENV || 'development';
  
  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: activeLevels[0],
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      )
    })
  ];

  // Add file transports for production
  if (env === 'production') {
    transports.push(
      new winston.transports.File({ 
        filename: 'error.log', 
        level: 'error' 
      }),
      new winston.transports.File({ 
        filename: 'combined.log',
        level: activeLevels[0]
      })
    );
  }

  return winston.createLogger({
    levels: customLevels.levels,
    level: activeLevels[0],
    format: winston.format.combine(
      winston.format.timestamp(),
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