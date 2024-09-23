import { NextFunction, Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';

import AppError from '../utils/appError';

const validateTicketId = (req: Request, res: Response, next: NextFunction) => {
  const { ticketId } = req.params;

  if (!isValidObjectId(ticketId)) return next(new AppError(`Invalid ticket ID: ${ticketId}`, 400));

  next();
};

export default validateTicketId;
