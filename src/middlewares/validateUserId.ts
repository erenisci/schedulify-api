import { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import AppError from '../utils/appError';

const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;

  if (!isValidObjectId(userId)) return next(new AppError(`Invalid user ID: ${userId}`, 400));

  next();
};

export default validateUserId;
