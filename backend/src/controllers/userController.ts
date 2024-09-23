import { NextFunction, Request, Response } from 'express';
import userService from '../services/userService';
import { AppError, createErrorResponse, errorTypes } from '../utils/AppError';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import { config } from '../config/enviroment';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const user = await userService.registerUser(username, email, password);
    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "User already exists") {
        throw createErrorResponse("User already exists", errorTypes.CONFLICT);
      }
      throw createErrorResponse("User not created", errorTypes.BAD_REQUEST);
    }
    throw createErrorResponse("An unexpected error occurred", errorTypes.INTERNAL_SERVER);
  }
};

export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      next(error);
    }
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret) as { email: string };
    const user = await prisma.users.findUnique({ where: { email: decoded.email } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = jwt.sign({ email: user.email }, config.jwtSecret, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ email: user.email }, config.refreshTokenSecret, { expiresIn: '7d' });

    await prisma.users.update({
      where: { email: user.email },
      data: { token: newAccessToken, refreshToken: newRefreshToken },
    });

    res.status(200).json({
      status: 'success',
      message: 'Tokens refreshed successfully',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        username: user.username,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Refresh token expired' });
    } else {
      res.status(500).json({ message: 'Error refreshing token' });
    }
  }
};

export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }
    const user = await userService.updateProfileImage(username, file);
    res.status(200).json({
      status: 'success',
      message: 'Image uploaded successfully',
      data: user,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(error.message === 'User not found' ? 404 : 500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
};