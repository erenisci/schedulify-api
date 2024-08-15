import mongoose from 'mongoose';

import IActivity from './activityType';

type IRoutine = {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  allTimeActivities: number;
  monday: IActivity[];
  tuesday: IActivity[];
  wednesday: IActivity[];
  thursday: IActivity[];
  friday: IActivity[];
  saturday: IActivity[];
  sunday: IActivity[];
};

export default IRoutine;
