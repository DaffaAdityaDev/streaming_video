import { Router } from 'express';
import { registerUser, loginUser, uploadProfileImage, refreshToken, changeUsername, updateUserProfile, getCurrentUserProfile } from '../../controllers/userController';
import multer from 'multer';
import path from 'path';
import { validateRegistration, validateLogin, validate } from '../../middlewares/validationMiddleware';
import authMiddleware from '../../middlewares/authMiddleware';
import fs from 'fs';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../profileImages/');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Use a temporary filename, it will be renamed in the service
    cb(null, `temp_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Version 1 routes
const v1Router = Router();

v1Router.post('/register', validateRegistration, validate, registerUser);
v1Router.post('/login', validateLogin, validate, loginUser);
v1Router.post('/upload-profile', authMiddleware, upload.single('image'), uploadProfileImage);
v1Router.post('/refresh-token', refreshToken); 
v1Router.post('/change-username', changeUsername);
v1Router.put('/update-profile', updateUserProfile);
v1Router.get('/user-profile', authMiddleware, getCurrentUserProfile);

// Apply v1 routes to the main router
router.use('/v1/user', v1Router);

export default router;