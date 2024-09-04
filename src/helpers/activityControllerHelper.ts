import mongoose from 'mongoose';

import Day from '../enums/dayEnum';
import Activity from '../models/activityModel';
import Routine from '../models/routineModel';
import IActivity from '../types/modelTypes/activityType';
import IRoutine from '../types/modelTypes/routineType';
import AppError from '../utils/appError';

export const getRoutineForUserOnDay = async (userId: string, day: string) => {
  const routine = await Routine.findOne({ user: userId });
  if (!routine) throw new AppError(`No activity found for ${day}!`, 404);

  const activities = routine[day as keyof IRoutine] as IActivity[] | undefined;
  if (!Array.isArray(activities) || activities.length === 0)
    throw new AppError(`No activity found for ${day}!`, 404);

  return activities;
};

export const createActivity = async (userId: string, day: Day, activity: any) => {
  let routine = await Routine.findOne({ user: userId });

  if (!routine) {
    routine = await Routine.create({
      user: userId,
      allTimeActivities: 0,
      [day]: [],
    });
  }

  const newActivity = new Activity({
    _id: new mongoose.Types.ObjectId(),
    routine: routine._id,
    startTime: activity.startTime,
    endTime: activity.endTime,
    activity: activity.activity,
    category: activity.category,
    color: activity.color,
  });

  const dayRoutines = routine[day] || [];
  for (const existingActivity of dayRoutines) {
    if (existingActivity.isTimeConflict(newActivity.startTime, newActivity.endTime))
      throw new AppError('Time conflict with existing activity!', 400);
  }

  routine[day].push(newActivity);
  routine.allTimeActivities += 1;

  await routine.save();
  await newActivity.save();

  return newActivity;
};

export const updateActivity = async (
  userId: string,
  day: Day,
  activityId: string,
  updatedActivity: any
) => {
  const routine = await Routine.findOne({ user: userId });
  if (!routine) throw new AppError('No routine found for this user!', 404);

  const activityIndex = routine[day].findIndex(activity => activity._id.toString() === activityId);
  routine[day].findIndex(activity => String(activity._id) === activityId);
  if (activityIndex === -1) throw new AppError('Activity not found!', 404);

  const currentActivity = routine[day][activityIndex];

  const updatedActivityWithConflictCheck: IActivity = {
    _id: currentActivity._id,
    routine: routine._id,
    startTime: updatedActivity.startTime || currentActivity.startTime,
    endTime: updatedActivity.endTime || currentActivity.endTime,
    activity: updatedActivity.activity || currentActivity.activity,
    category: updatedActivity.category || currentActivity.category,
    color: updatedActivity.color || currentActivity.color,
    isTimeConflict: currentActivity.isTimeConflict,
  };

  for (const existingActivity of routine[day]) {
    if (
      existingActivity._id.toString() !== activityId &&
      existingActivity.isTimeConflict(
        updatedActivityWithConflictCheck.startTime,
        updatedActivityWithConflictCheck.endTime
      )
    )
      throw new AppError('Time conflict with existing activity!', 400);
  }

  routine[day][activityIndex] = updatedActivityWithConflictCheck;

  await Activity.findByIdAndUpdate(activityId, updatedActivityWithConflictCheck, {
    new: true,
  });
  await routine.save();

  return updatedActivityWithConflictCheck;
};
