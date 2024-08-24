import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userRepository from '../repository/userRepository';
import { config } from '../config/enviroment';

const registerUser = async (username: string, email: string, password: string) => {
  if (!username || !email || !password) {
    throw new Error('Please fill in all fields');
  }

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    username,
    email,
    password: hashedPassword,
    image_url: 'https://res.cloudinary.com/dkkgmzpqd/image/upload/v1628074759/default-profile-picture-300x300_y3c5xw.png',
  });

  return { username: user.username, email: user.email };
};

const loginUser = async (email: string, password: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    throw new Error('Invalid credentials');
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

const updateProfileImage = async (username: string, file: Express.Multer.File) => {
  const imageId = file.filename;
  const user = await userRepository.updateByUsername(username, { image_url: imageId });
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export default { registerUser, loginUser, updateProfileImage };