import { NextFunction, Request, Response } from 'express';

import Day from '../enums/dayEnum';
import { isValidDay } from '../services/routineService';
import AppError from '../utils/appError';

const validateDay = (req: Request, res: Response, next: NextFunction) => {
  const day: Day = req.params.day as Day;

  if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

  next();
};

export default validateDay;
