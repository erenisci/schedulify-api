import mongoose from 'mongoose';

type ICompletedActivity = {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  activityId: mongoose.Types.ObjectId;
  activity: string;
  duration: number;
  category: string;
  completedAt: Date;
};

export default ICompletedActivity;
