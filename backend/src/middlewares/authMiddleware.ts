import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import jwt from 'jsonwebtoken';
import { getConfig } from '../config/environment';
import prisma from '../config/database';

const CONFIG = getConfig();

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, CONFIG.jwtSecret) as { email: string };
    const user = await prisma.users.findUnique({ where: { email: decoded.email } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default authMiddleware;