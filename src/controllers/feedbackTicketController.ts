import { NextFunction, Request, Response } from 'express';

import FeedbackTicket from '../models/feedbackTicketModel';
import { getPaginationParams } from '../services/feedbackTicketService';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

// FOR USERS
export const getMyTickets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;
  const { page, limit, skip } = getPaginationParams(req);

  const myTickets = await FeedbackTicket.find({ userId, type: 'ticket' }).skip(skip).limit(limit);

  if (!myTickets || myTickets.length === 0)
    return next(new AppError('No tickets found for your account!', 404));

  const totalResults = await FeedbackTicket.countDocuments({ userId, type: 'ticket' });

  res.status(200).json({
    status: 'success',
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
    pageResults: myTickets.length,
    totalResults,
    data: {
      myTickets,
    },
  });
});

export const createFeedbackTicket = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { title, type, message } = req.body;

    if (!['feedback', 'ticket'].includes(type))
      return next(new AppError('Type must be either feedback or ticket!', 400));

    const newTicket = await FeedbackTicket.create({
      userId: req.user.id,
      type,
      title,
      message,
    });

    res.status(201).json({
      status: 'success',
      data: newTicket,
    });
  }
);

// FOR ADMINS
export const getTickets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, skip } = getPaginationParams(req);

  const tickets = await FeedbackTicket.find({ type: 'ticket' }).skip(skip).limit(limit);
  if (!tickets || tickets.length === 0) return next(new AppError('No ticket found!', 404));

  const totalResults = await FeedbackTicket.countDocuments({ type: 'ticket' });

  res.status(200).json({
    status: 'success',
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
    pageResults: tickets.length,
    totalResults,
    data: {
      tickets,
    },
  });
});

export const markTicketAsClosed = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ticketId } = req.params;

    const updatedTicket = await FeedbackTicket.findById(ticketId);
    if (!updatedTicket) return next(new AppError('No feedback or ticket found with that ID!', 404));
    if (updatedTicket.type !== 'ticket')
      return next(new AppError('Only tickets can be marked as closed!', 400));

    const closedTicket = await FeedbackTicket.findByIdAndUpdate(
      ticketId,
      { isSolved: true },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: closedTicket,
    });
  }
);

export const markTicketAsUnclosed = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ticketId } = req.params;

    const updatedTicket = await FeedbackTicket.findById(ticketId);
    if (!updatedTicket) return next(new AppError('No feedback or ticket found with that ID!', 404));
    if (updatedTicket.type !== 'ticket')
      return next(new AppError('Only tickets can be marked as unclosed!', 400));

    const unclosedTicket = await FeedbackTicket.findByIdAndUpdate(
      ticketId,
      { isSolved: false },
      { new: true }
    );

    res.status(200).json({
      status: 'success',
      data: unclosedTicket,
    });
  }
);

// FOR SUPER-ADMINS
export const getFeedbacks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { page, limit, skip } = getPaginationParams(req);

  const feedbacks = await FeedbackTicket.find({ type: 'feedback' }).skip(skip).limit(limit);
  if (!feedbacks || feedbacks.length === 0) return next(new AppError('No feedback found!', 404));

  const totalResults = await FeedbackTicket.countDocuments({ type: 'feedback' });

  res.status(200).json({
    status: 'success',
    currentPage: page,
    totalPages: Math.ceil(totalResults / limit),
    pageResults: feedbacks.length,
    totalResults,
    data: {
      feedbacks,
    },
  });
});

export default {
  getMyTickets,
  createFeedbackTicket,
  getTickets,
  markTicketAsClosed,
  markTicketAsUnclosed,
  getFeedbacks,
};
