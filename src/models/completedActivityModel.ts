import mongoose from 'mongoose';

import Category from '../enums/categoryEnum';
import ICompletedActivity from '../types/modelTypes/completedActivityType';

const completedActivitySchema = new mongoose.Schema({
  activityId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Activity',
    required: true,
  },
  activity: {
    type: String,
    required: [true, 'Activity field is required!'],
  },
  duration: {
    type: Number,
  },
  category: {
    type: String,
    required: [true, 'Category field is required!'],
    lowercase: true,
    enum: Object.values(Category),
  },
  completedAt: {
    type: Date,
    default: Date.now,
  },
});

const CompletedActivity = mongoose.model<ICompletedActivity>(
  'CompletedActivity',
  completedActivitySchema
);

export default CompletedActivity;
