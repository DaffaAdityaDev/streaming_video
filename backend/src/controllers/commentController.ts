import { Request, Response } from 'express';
import commentService from '../services/commentService';
import { CommentError } from '../utils/CommentError';
import { logger } from '../utils/logger';

export const createComment = async (req: Request, res: Response) => {
  try {
    const { body, id_video, email } = req.body;
    const comment = await commentService.createComment(body, id_video, email);
    res.status(201).json({
      status: 'success',
      data: comment,
    });
  } catch (error) {
    handleCommentError(error, res);
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { id_video } = req.params;
    const comments = await commentService.getComments(parseInt(id_video));
    res.status(200).json({
      status: 'success',
      data: comments,
    });
  } catch (error) {
    handleCommentError(error, res);
  }
}; 

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { id_comment } = req.params;
    const { body } = req.body;
    const comment = await commentService.updateComment(parseInt(id_comment), body);
    res.status(200).json({
      status: 'success',
      data: comment,
    });
  } catch (error) {
    handleCommentError(error, res);
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { id_comment } = req.params;
    const comment = await commentService.deleteComment(parseInt(id_comment));
    res.status(200).json({
      status: 'success',
      data: comment,
    });
  } catch (error) {
    handleCommentError(error, res);
  }
};

export const getLastestComments = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const decodedEmail = Buffer.from(email, 'base64').toString('utf-8');
    const comments = await commentService.getLastestComments(decodedEmail);
    res.status(200).json({
      status: 'success',
      data: comments,
    });
  } catch (error) {
    handleCommentError(error, res);
  }
};

const handleCommentError = (error: unknown, res: Response) => {
  logger.error('Error in comment operation:', error);
  if (error instanceof CommentError) {
    res.status(error.statusCode).json({
      status: 'error',
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred',
    });
  }
};