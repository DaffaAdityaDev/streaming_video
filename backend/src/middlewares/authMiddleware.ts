import { User } from './../models/userModel';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import userRepository from '../repository/userRepository';
import prisma from '../config/database';

interface RequestWithUser extends Request {
  user?: { email: string };
}

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).send('Access denied. No token provided.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { email: string };
    const user = await prisma.users.findUnique({ where: { email: decoded.email } });
    if (!user) {
      return res.status(401).send('User not found.');
    }
    req.user = user;
    next();
  } catch (ex) {
    res.status(400).send('Invalid token.');
  }
};

export default authMiddleware;