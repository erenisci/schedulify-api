import { NextFunction, Request, Response } from 'express';

import countries from '../data/countries';
import AppError from '../utils/appError';

const validateNationality = (req: Request, res: Response, next: NextFunction) => {
  const nationality = req.body.nationality;

  if (nationality && !countries[nationality])
    return next(new AppError('Invalid nationality code! (Alpha-3)', 400));

  if (nationality) req.body.nationality = countries[nationality];

  next();
};

export default validateNationality;
