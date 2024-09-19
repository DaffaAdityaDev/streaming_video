import { Router } from 'express';
import { createComment, getComments, updateComment, deleteComment, getLastestComments } from '../../controllers/commentController';
import authMiddleware from '../../middlewares/authMiddleware';

const router = Router();

// Version 1 routes
const v1Router = Router();

v1Router.post('/', authMiddleware, createComment);
v1Router.get('/:id_video', getComments);
v1Router.put('/:id_comment', authMiddleware, updateComment);
v1Router.delete('/:id_comment', authMiddleware, deleteComment);
v1Router.get('/lastest/:email', getLastestComments);

// Apply v1 routes to the main router
router.use('/v1/comment', v1Router);

export default router; 