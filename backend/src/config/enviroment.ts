import dotenv from 'dotenv';

dotenv.config();

export const config = {
  url: process.env.URL || 'http://localhost',
  port: process.env.PORT || 3001,
  webSocketPort: process.env.WEBSOCKET_PORT || 3002,
  jwtSecret: process.env.JWT_SECRET || 'defaultSecret',
  databaseUrl: process.env.DATABASE_URL,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'defaultRefreshSecret',
  maxVideoProcessingQueue: process.env.MAX_VIDEO_PROCESSING_QUEUE || '2',
  timezone: process.env.TIMEZONE || 'Asia/Jakarta',
};