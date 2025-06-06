import { AppError } from "./AppError";



export class CommentError extends AppError {
    constructor(message: string, statusCode: number = 400) {
      super(message, statusCode);
      this.name = 'CommentError';
    }
  }