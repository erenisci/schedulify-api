import { NextFunction } from 'express';
import AppError from './appError';

export const filterObj = (
  obj: Record<string, any>,
  ...allowedFields: string[]
) => {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

export const filterObjError = (next: NextFunction) => {
  return next(
    new AppError(
      'You must provide at least one field to update: time or activity.',
      400
    )
  );
};

export default { filterObj, filterObjError };
