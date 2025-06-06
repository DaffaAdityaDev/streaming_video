import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { getConfig } from '../config/environment';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const config = getConfig();
  
  if (!config.databaseUrl.includes('test')) {
    throw new Error('Tests must use a test database');
  }

  // Run migrations
  execSync('npx prisma migrate deploy');

  // Clear the database
  await prisma.$executeRaw`TRUNCATE TABLE "Users", "Videos", "Comments" CASCADE;`;
});


afterAll(async () => {
  await prisma.$disconnect();
});