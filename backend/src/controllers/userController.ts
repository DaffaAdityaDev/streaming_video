import { NextFunction, Request, Response } from 'express';
import userService from '../services/userService';
import { AppError, createErrorResponse, errorTypes } from '../utils/AppError';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';
import { config } from '../config/enviroment';
import { AuthenticatedRequest } from '../types';
import userRepository from '../repository/userRepository';

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

export const uploadProfileImage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const file = req.file;
    const userEmail = req.user?.email;

    if (!file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded',
      });
    }

    if (!userEmail) {
      return res.status(401).json({
        status: 'error',
        message: 'User not authenticated',
      });
    }

    const user = await userService.updateProfileImage(userEmail, file);
    res.status(200).json({
      status: 'success',
      message: 'Profile image updated successfully',
      data: {
        image_url: user.image_url,
      },
    });
  } catch (error) {
    console.error('Error uploading profile image:', error);
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while uploading the profile image',
    });
  }
};

export const changeUsername = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newUsername } = req.body;
    const result = await userService.changeUsername(email, newUsername);
    res.status(200).json({
      status: 'success',
      message: 'Username updated successfully',
      data: result
    });
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

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const { currentEmail, ...updateData } = req.body;
    if (!currentEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Current email is required',
      });
    }

    // Remove any empty fields from updateData
    Object.keys(updateData).forEach(key => 
      (updateData[key] === '' || updateData[key] === undefined) && delete updateData[key]
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update',
      });
    }

    const updatedUser = await userService.updateUserProfile(currentEmail, updateData);
    res.status(200).json({
      status: 'success',
      message: 'User profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({
        status: 'error',
        message: 'An unexpected error occurred',
      });
    }
  }
};

// Change the function name
export const getCurrentUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await userRepository.findByEmail(userEmail);
    if (!user) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.status(200).json({
      status: 'success',
      data: {
        username: user.username,
        email: user.email,
        image_url: user.image_url,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};