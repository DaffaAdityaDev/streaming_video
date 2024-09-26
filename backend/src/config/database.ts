import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('database');
const prisma = new PrismaClient();

export default prisma;

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.info('Successfully connected to the database');
    return true;
  } catch (error) {
    logger.error('Failed to connect to the database:', error);
    return false;
  }
} 