import mongoose, { Model } from 'mongoose';

import Category from '../enums/categoryEnum';
import IActivity from '../types/modelTypes/activityType';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  routineId: {
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
  duration: {
    type: Number,
  },
  activity: {
    type: String,
    required: [true, 'Activity field is required!'],
  },
  category: {
    type: String,
    required: [true, 'Category field is required!'],
    lowercase: true,
    enum: Object.values(Category),
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  color: {
    type: String,
    default: '#fff', // will change
    lowercase: true,
    validate: {
      validator: function (v: string) {
        return /^#[0-9A-F]{6}$|^#[0-9A-F]{3}$/i.test(v);
      },
      message: 'Invalid color hex code!',
    },
  },
});

activitySchema.pre('save', function (next) {
  const startTime = new Date(`1970-01-01T${this.startTime}:00`);
  const endTime = new Date(`1970-01-01T${this.endTime}:00`);

  if (startTime.getTime() === endTime.getTime())
    return next(new Error('Start time and end time cannot be the same!'));

  if (endTime < startTime) return next(new Error('End time cannot be before start time!'));

  this.duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  next();
});

activitySchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as mongoose.UpdateQuery<IActivity>;

  const startTime = new Date(`1970-01-01T${update.startTime}:00`);
  const endTime = new Date(`1970-01-01T${update.endTime}:00`);

  if (startTime.getTime() === endTime.getTime())
    return next(new Error('Start time and end time cannot be the same!'));

  if (endTime < startTime) return next(new Error('End time cannot be before start time!'));

  update.duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

  next();
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
