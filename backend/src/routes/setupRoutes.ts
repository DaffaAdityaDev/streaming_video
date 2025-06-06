// src/routes/index.ts

import { Application } from 'express';
import userRoutes from './v1/userRoutes';
import commentRoutes from './v1/commentRoutes';
import videoRoutes from './v1/videoRoutes';

export const setupRoutes = (app: Application): void => {
  app.use('/api', userRoutes);
  app.use('/api', commentRoutes);
  app.use('/api', videoRoutes);

  app.get('/', (req, res) => {
    res.send('Hello, Developer! Start your CRAFT here');
  });
};