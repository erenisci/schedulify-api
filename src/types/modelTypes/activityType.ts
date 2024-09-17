import mongoose from 'mongoose';

type IActivity = {
  _id: mongoose.Types.ObjectId;
  routine: mongoose.Types.ObjectId;
  startTime: string;
  endTime: string;
  duration: number;
  activity: string;
  category: string;
  isCompleted: boolean;
  color: string;
  isTimeConflict: (newStartTime: string, newEndTime: string) => boolean;
};

export default IActivity;
