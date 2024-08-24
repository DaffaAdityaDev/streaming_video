import { Request, Response } from 'express';
import commentService from '../services/commentService';

export const createComment = async (req: Request, res: Response) => {
  try {
    const { body, id_video, email } = req.body;
    const comment = await commentService.createComment(body, id_video, email);
    res.status(201).json({
      status: 'success',
      data: comment,
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

export const getComments = async (req: Request, res: Response) => {
  try {
    const { id_video } = req.params;
    const comments = await commentService.getComments(parseInt(id_video));
    res.status(200).json({
      status: 'success',
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error fetching comments',
    });
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
    res.status(500).json({
      status: 'error',
      message: 'Error updating comment',
    });
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
    res.status(500).json({
      status: 'error',
      message: 'Error deleting comment',
    });
  }
};