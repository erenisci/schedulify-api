import { NextFunction, Request, Response } from 'express';

import AppError from '../utils/appError';

export default (err: AppError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    MessageChannel: err.message,
  });
};
