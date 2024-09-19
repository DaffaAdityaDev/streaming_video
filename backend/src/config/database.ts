import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;

export async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
    return true;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    return false;
  }
} 