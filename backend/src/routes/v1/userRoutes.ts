import { Router } from 'express';
import { registerUser, loginUser, uploadProfileImage } from '../../controllers/userController';
import multer from 'multer';
import path from 'path';
import { validateRegistration, validateLogin, validate } from '../../middlewares/validationMiddleware';

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../profileImages/'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Version 1 routes
const v1Router = Router();

v1Router.post('/register', validateRegistration, validate, registerUser);
v1Router.post('/login', validateLogin, validate, loginUser);
v1Router.post('/upload-profile', upload.single('image'), uploadProfileImage);

// Apply v1 routes to the main router
router.use('/v1/user', v1Router);

export default router;