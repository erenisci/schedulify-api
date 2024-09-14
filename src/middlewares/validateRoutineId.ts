import { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import AppError from '../utils/appError';

const validateRoutineId = (req: Request, res: Response, next: NextFunction) => {
  const { routineId } = req.params;

  if (!isValidObjectId(routineId))
    return next(new AppError(`Invalid routine ID: ${routineId}`, 400));

  next();
};

export default validateRoutineId;
