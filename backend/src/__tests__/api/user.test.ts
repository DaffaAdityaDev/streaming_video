import request from 'supertest';
import { Express } from 'express';
import { Server } from 'http';
import prisma from '../../config/database';
import { setupRoutes } from '../../routes/setupRoutes';
import express from 'express';
import { getConfig } from '../../config/environment';
import path from 'path';

let app: Express;
let server: Server;

beforeAll(async () => {
  app = express();
  setupRoutes(app);
  const config = getConfig();
  server = app.listen(config.port);
});

afterAll(async () => {
  await prisma.$disconnect();
  server.close();
});

async function getAuthToken(app: Express): Promise<string> {
  await request(app)
    .post('/api/v1/user/register')
    .send({
      username: 'authuser',
      email: 'auth@example.com',
      password: 'authpass123'
    });
  
  const loginRes = await request(app)
    .post('/api/v1/user/login')
    .send({
      email: 'auth@example.com',
      password: 'authpass123'
    });
  
  return loginRes.body.token;
}

describe('User API', () => {
  beforeEach(async () => {
    await prisma.users.deleteMany();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/user/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('username', 'testuser');
    expect(res.body.data).toHaveProperty('email', 'test@example.com');
  });

  it('should login a user', async () => {
    const res = await request(app)
      .post('/api/v1/user/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('token');
  });

  it('should upload a profile image', async () => {
    const token = await getAuthToken(app);
    const res = await request(app)
      .post('/api/v1/user/upload-profile')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', path.join(__dirname, '../../../test/fixtures/test-image.jpg'));
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('image_url');
  });

  it('should change username', async () => {
    const token = await getAuthToken(app);
    const res = await request(app)
      .post('/api/v1/user/change-username')
      .set('Authorization', `Bearer ${token}`)
      .send({ newUsername: 'newAuthUser' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('username', 'newAuthUser');
  });

  it('should update user profile', async () => {
    const token = await getAuthToken(app);
    const res = await request(app)
      .put('/api/v1/user/update-profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'newemail@example.com' });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('email', 'newemail@example.com');
  });

  it('should get current user profile', async () => {
    const token = await getAuthToken(app);
    const res = await request(app)
      .get('/api/v1/user/user-profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('username');
    expect(res.body.data).toHaveProperty('email');
  });

  // Add test for refresh token endpoint
});