import mongoose, { Model } from 'mongoose';
import Day from '../types/dayType';
import IRoutine from '../types/routineType';
import activitySchema from './activityModel';

const routineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  allTimeActivities: {
    type: Number,
    default: 0,
  },
  monday: {
    type: [activitySchema],
    default: [],
  },
  tuesday: {
    type: [activitySchema],
    default: [],
  },
  wednesday: {
    type: [activitySchema],
    default: [],
  },
  thursday: {
    type: [activitySchema],
    default: [],
  },
  friday: {
    type: [activitySchema],
    default: [],
  },
  saturday: {
    type: [activitySchema],
    default: [],
  },
  sunday: {
    type: [activitySchema],
    default: [],
  },
});

routineSchema.pre<IRoutine>('save', function (next) {
  const days: Day[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  for (const day of days) {
    if (this[day]) {
      this[day].sort((a, b) => {
        return a.time.localeCompare(b.time);
      });
    }
  }

  next();
});

const Routine: Model<IRoutine> = mongoose.model<IRoutine>(
  'Routine',
  routineSchema
);

export default Routine;
