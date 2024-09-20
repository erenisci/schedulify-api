import { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import AppError from '../utils/appError';

const validateActivityId = async (req: Request, res: Response, next: NextFunction) => {
  const { activityId } = req.params;

  if (!isValidObjectId(activityId))
    return next(new AppError(`Invalid activity ID: ${activityId}`, 400));

  next();
};

export default validateActivityId;
