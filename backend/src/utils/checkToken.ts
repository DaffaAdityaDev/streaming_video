import { PrismaClient } from '@prisma/client';
import jwt, { JwtPayload } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { RequestWithUser } from '../types';

dotenv.config();
const prisma = new PrismaClient();

const checkToken = async (req: RequestWithUser, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message:
        'Invalid or missing token format. Please provide a valid Bearer token.',
    });
  }
  const token = authHeader.split(' ')[1];

  try {
    // Ensure JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET is not defined in the environment variables.',
      );
    }

    // Verify the token and extract the user's email
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload; // Assert the type here
    const userEmail = decoded.email;

    // Find the user by email to get their id_user
    const user = await prisma.users.findUnique({
      where: {
        email: userEmail,
      },
    });

    if (user) {
      // Attach the user's email to the request object
      req.user = { email: userEmail };
      next();
      console.log('User found:', user);
    } else {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export default checkToken;
