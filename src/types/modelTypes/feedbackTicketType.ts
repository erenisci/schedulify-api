import mongoose from 'mongoose';

type IFeedbackTicket = {
  userId: mongoose.Types.ObjectId;
  type: 'feedback' | 'ticket';
  title: string;
  message: string;
  isSolved: boolean;
  createdAt: Date;
};

export default IFeedbackTicket;
