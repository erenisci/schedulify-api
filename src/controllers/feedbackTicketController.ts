import { NextFunction, Request, Response } from 'express';

import FeedbackTicket from '../models/feedbackTicketModel';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

// FOR USERS
export const getMyTickets = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user.id;

  const features = new APIFeatures(
    FeedbackTicket.find({ userId, type: 'ticket' }),
    req.query,
    FeedbackTicket
  );

  const { results: myTickets, totalPages, currentPage } = await features.paginate();

  const totalTicketsCount = await FeedbackTicket.countDocuments({ type: 'ticket' });

  if (!myTickets || myTickets.length === 0)
    return next(new AppError('No tickets found for your account!', 404));

  res.status(200).json({
    status: 'success',
    currentPage,
    totalPages,
    pageResults: myTickets.length,
    totalResults: totalTicketsCount,
    data: {
      tickets: myTickets,
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
  const features = new APIFeatures(FeedbackTicket.find(), req.query, FeedbackTicket);

  const {
    results: feedbackTickets,
    totalPages,
    currentPage,
    totalResults,
  } = await features.paginate();

  if (!feedbackTickets || feedbackTickets.length === 0) {
    return next(new AppError('No feedback or ticket found!', 404));
  }

  res.status(200).json({
    status: 'success',
    currentPage,
    totalPages,
    pageResults: feedbackTickets.length,
    totalResults,
    data: {
      feedbackTickets,
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

export const getFeedbacks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const features = new APIFeatures(
    FeedbackTicket.find({ type: 'feedback' }),
    req.query,
    FeedbackTicket
  );

  const {
    results: feedbackTickets,
    totalPages,
    currentPage,
    totalResults,
  } = await features.paginate();

  if (!feedbackTickets || feedbackTickets.length === 0) {
    return next(new AppError('No feedback found!', 404));
  }

  res.status(200).json({
    status: 'success',
    currentPage,
    totalPages,
    pageResults: feedbackTickets.length,
    totalResults,
    data: {
      feedbackTickets,
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
