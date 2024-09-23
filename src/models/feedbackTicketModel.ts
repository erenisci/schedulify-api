import mongoose from 'mongoose';

import IFeedbackTicket from '../types/modelTypes/feedbackTicketType';

const feedbackTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['feedback', 'ticket'],
    required: [true, 'Type must be either feedback or ticket!'],
  },
  title: {
    type: String,
    required: [true, 'A title is required!'],
  },
  message: {
    type: String,
    required: [true, 'A message is required!'],
  },
  isSolved: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const FeedbackTicket = mongoose.model<IFeedbackTicket>('FeedbackTicket', feedbackTicketSchema);

export default FeedbackTicket;
