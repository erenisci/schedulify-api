import validator from 'validator';

import Category from '../enums/categoryEnum';
import Day from '../enums/dayEnum';
import IActivity from '../types/modelTypes/activityType';
import AppError from '../utils/appError';

export const isValidTimeFormat = (time: string) => {
  const timeFormat = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!validator.matches(time, timeFormat))
    throw new AppError('Time must be in HH:mm format!', 400);
};

export const isValidDay = (day: string): day is Day => {
  return Object.values(Day).includes(day as Day);
};

export const isValidCategory = (category: string): boolean => {
  return Object.values(Category).includes(category as Category);
};

export const validateActivityTimes = (activity: IActivity) => {
  isValidTimeFormat(activity.startTime);
  isValidTimeFormat(activity.endTime);
};

export const validateActivityFields = (activity: Partial<IActivity>) => {
  if (
    !activity ||
    !activity.startTime ||
    !activity.endTime ||
    !activity.activity ||
    !activity.category
  )
    throw new AppError(
      'All fields (startTime, endTime, activity, category) are required, except color!',
      400
    );

  if (activity.category && !isValidCategory(activity.category))
    throw new AppError('Invalid category provided!', 400);
};
