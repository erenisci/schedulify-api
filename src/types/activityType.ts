import mongoose from 'mongoose';

type IActivity = {
  _id: mongoose.Types.ObjectId;
  routine: mongoose.Types.ObjectId;
  startTime: string;
  endTime: string;
  activity: string;
  category: string;
  color: string;
  isTimeConflict: (newStartTime: string, newEndTime: string) => boolean;
};

export default IActivity;
