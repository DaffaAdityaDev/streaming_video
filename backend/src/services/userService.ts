import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repository/userRepository';
import { config } from '../config/enviroment';
import { AppError, errorTypes } from '../utils/AppError';
import { Users } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const registerUser = async (username: string, email: string, password: string) => {
  if (!username || !email || !password) {
    throw new AppError('Please fill in all fields', errorTypes.BAD_REQUEST);
  }

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new AppError('User already exists', errorTypes.CONFLICT);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    username,
    email,
    password: hashedPassword,
    image_url: 'https://res.cloudinary.com/dkkgmzpqd/image/upload/v1628074759/default-profile-picture-300x300_y3c5xw.png',
    refreshToken: null,
  });

  return { username: user.username, email: user.email };
};

const loginUser = async (email: string, password: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', errorTypes.UNAUTHORIZED);
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    throw new AppError('Invalid email or password', errorTypes.UNAUTHORIZED);
  }

  const token = jwt.sign({ email }, config.jwtSecret, { expiresIn: '7d' });
  await userRepository.update(email, { token });

  return {
    status: 'success',
    message: 'User logged in successfully',
    token,
    username: user.username,
    email: user.email,
    image_url: user.image_url,
  };
};

const updateProfileImage = async (email: string, file: Express.Multer.File) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('User not found');
  }

  const imageFileName = `${user.id_user}.png`;
  const imagePath = path.join(__dirname, '../../profileImages', imageFileName);

  // Delete old image if it exists
  try {
    await fs.unlink(imagePath);
  } catch (error) {
    // Ignore error if file doesn't exist
  }

  // Save new image
  await fs.rename(file.path, imagePath);

  const updatedUser = await userRepository.update(email, { image_url: imageFileName });

  return updatedUser;
};

const changeUsername = async (email: string, newUsername: string) => {
  const existingUser = await userRepository.findByEmail(email);
  if (!existingUser) {
    throw new AppError('User not found', errorTypes.NOT_FOUND);
  }

  const userWithNewUsername = await userRepository.findByEmail(newUsername);
  if (userWithNewUsername) {
    throw new AppError('Username already taken', errorTypes.CONFLICT);
  }

  const updatedUser = await userRepository.updateUsername(email, newUsername);
  return { username: updatedUser.username, email: updatedUser.email };
};

const updateUserProfile = async (email: string, updateData: Partial<Users>) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new AppError('User not found', errorTypes.NOT_FOUND);
  }

  if (updateData.email && updateData.email !== email) {
    const existingUser = await userRepository.findByEmail(updateData.email);
    if (existingUser) {
      throw new AppError('Email already in use', errorTypes.CONFLICT);
    }
  }

  if (updateData.username) {
    const existingUser = await userRepository.findByUsername(updateData.username);
    if (existingUser && existingUser.id_user !== user.id_user) {
      throw new AppError('Username already taken', errorTypes.CONFLICT);
    }
  }

  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const updatedUser = await userRepository.update(email, updateData);
  return {
    username: updatedUser.username,
    email: updatedUser.email,
    image_url: updatedUser.image_url,
  };
};

export default { registerUser, loginUser, updateProfileImage, changeUsername, updateUserProfile };