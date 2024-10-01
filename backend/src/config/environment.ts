import dotenv from 'dotenv';

dotenv.config();

interface Config {
  url: string;
  port: number;
  webSocketPort: number;
  jwtSecret: string;
  databaseUrl: string;
  refreshTokenSecret: string;
  maxVideoProcessingQueue: number;
  timezone: string;
}

export const getConfig = (): Config => ({
  url: process.env.URL || 'http://localhost',
  port: Number(process.env.PORT) || 3001,
  webSocketPort: Number(process.env.WEBSOCKET_PORT) || 3002,
  jwtSecret: process.env.JWT_SECRET || 'defaultSecret',
  databaseUrl: process.env.DATABASE_URL || '',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'defaultRefreshSecret',
  maxVideoProcessingQueue: Number(process.env.MAX_VIDEO_PROCESSING_QUEUE) || 2,
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
});