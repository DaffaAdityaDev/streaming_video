import { Request, Response } from 'express';
import userService from '../services/userService';

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
      res.status(error.message === 'User already exists' ? 409 : 500).json({
        status: 'error',
        message: error.message,
      });
    }
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await userService.loginUser(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(error.message === 'Invalid credentials' ? 401 : 500).json({
        status: 'error',
        message: error.message,
      });
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