import mongoose from 'mongoose';

export type Activity = {
  _id: mongoose.Types.ObjectId;
  time: string;
  activity: string;
};

type IRoutine = {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  allTimeActivities: number;
  monday: Activity[];
  tuesday: Activity[];
  wednesday: Activity[];
  thursday: Activity[];
  friday: Activity[];
  saturday: Activity[];
  sunday: Activity[];
};

export default IRoutine;
