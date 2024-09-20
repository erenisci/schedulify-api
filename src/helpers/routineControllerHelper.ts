import mongoose from 'mongoose';

import Day from '../enums/dayEnum';
import Activity from '../models/activityModel';
import Routine from '../models/routineModel';
import IActivity from '../types/modelTypes/activityType';
import IRoutine from '../types/modelTypes/routineType';
import AppError from '../utils/appError';

const calculateDuration = (startTime: string, endTime: string): number => {
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);

  if (end <= start) {
    throw new Error('End time must be after start time!');
  }

  return (end.getTime() - start.getTime()) / (1000 * 60);
};

export const getRoutineForUserOnDay = async (userId: string, day: string) => {
  const routine = await Routine.findOne({ userId });
  if (!routine) throw new AppError(`No activity found for ${day}!`, 404);

  const activities = routine[day as keyof IRoutine] as IActivity[] | undefined;
  if (!Array.isArray(activities) || activities.length === 0)
    throw new AppError(`No activity found for ${day}!`, 404);

  return activities;
};

export const createActivity = async (userId: string, day: Day, activity: any) => {
  let routine = await Routine.findOne({ userId });

  if (!routine) {
    routine = await Routine.create({
      userId,
      allTimeActivities: 0,
      [day]: [],
    });
  }

  const newActivity = new Activity({
    _id: new mongoose.Types.ObjectId(),
    userId,
    routineId: routine._id,
    startTime: activity.startTime,
    endTime: activity.endTime,
    duration: activity.duration,
    activity: activity.activity,
    category: activity.category,
    isCompleted: activity.isCompleted,
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
  const routine = await Routine.findOne({ userId });
  if (!routine) throw new AppError('No routine found for this user!', 404);

  const activityIndex = routine[day].findIndex(activity => activity._id.toString() === activityId);
  routine[day].findIndex(activity => String(activity._id) === activityId);
  if (activityIndex === -1) throw new AppError(`No activity found for ${day}!`, 404);

  const currentActivity = routine[day][activityIndex];

  if (updatedActivity.startTime || updatedActivity.endTime) {
    const startTime = updatedActivity.startTime || currentActivity.startTime;
    const endTime = updatedActivity.endTime || currentActivity.endTime;

    updatedActivity.duration = calculateDuration(startTime, endTime);
  }

  const updatedActivityWithConflictCheck: IActivity = {
    _id: currentActivity._id,
    userId: routine.userId,
    routineId: routine._id,
    startTime: updatedActivity.startTime || currentActivity.startTime,
    endTime: updatedActivity.endTime || currentActivity.endTime,
    duration: updatedActivity.duration || currentActivity.duration,
    activity: updatedActivity.activity || currentActivity.activity,
    category: updatedActivity.category || currentActivity.category,
    isCompleted: updatedActivity.isCompleted || currentActivity.isCompleted,
    color: updatedActivity.color || currentActivity.color,
    isTimeConflict: currentActivity.isTimeConflict,
  };

  for (const existingActivity of routine[day]) {
    if (
      String(existingActivity._id) !== activityId &&
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
