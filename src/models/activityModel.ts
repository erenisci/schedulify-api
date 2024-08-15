import mongoose, { Model } from 'mongoose';

import Category from '../enums/categoryEnum';
import IActivity from '../types/activityType';

const activitySchema = new mongoose.Schema({
  routine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Routine',
    required: true,
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required!'],
  },
  endTime: {
    type: String,
    required: [true, 'End time is required!'],
  },
  activity: {
    type: String,
    required: [true, 'Activity field is required!'],
  },
  category: {
    type: String,
    enum: Object.values(Category),
    default: 'leisure',
    required: [true, 'Category field is required!'],
  },
});

activitySchema.methods.isTimeConflict = function (
  newStartTime: string,
  newEndTime: string
): boolean {
  const existingStartTime = new Date(`1970-01-01T${this.startTime}:00`);
  const existingEndTime = new Date(`1970-01-01T${this.endTime}:00`);
  const newStart = new Date(`1970-01-01T${newStartTime}:00`);
  const newEnd = new Date(`1970-01-01T${newEndTime}:00`);

  return (
    (newStart < existingEndTime && newEnd > existingStartTime) ||
    (existingStartTime < newEnd && existingEndTime > newStart)
  );
};

const Activity: Model<IActivity> = mongoose.model<IActivity>('Activity', activitySchema);

export { activitySchema };
export default Activity;
