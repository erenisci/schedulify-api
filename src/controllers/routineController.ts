import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import validator from 'validator';

import Category from '../enums/categoryEnum';
import Day from '../enums/dayEnum';
import Activity from '../models/activityModel';
import Routine from '../models/routineModel';
import IActivity from '../types/activityType';
import IRoutine from '../types/routineType';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { filterObj, filterObjError } from '../utils/filter';

const isValidTimeFormat = (time: string) => {
  const timeFormat = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!validator.matches(time, timeFormat))
    throw new AppError('Time must be in HH:mm format!', 400);
};

const isValidDay = (day: string): day is Day => {
  return Object.values(Day).includes(day as Day);
};

const isValidCategory = (category: string): boolean => {
  return Object.values(Category).includes(category as Category);
};

const validateActivityFields = (activity: Partial<IActivity>) => {
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

const getRoutineForUserOnDay = async (userId: string, day: string) => {
  if (!isValidDay(day)) throw new AppError('Invalid day provided!', 400);

  const routine = await Routine.findOne({ user: userId });
  if (!routine) throw new AppError(`No activity found for ${day}!`, 404);

  const activities = routine[day as keyof IRoutine] as IActivity[] | undefined;
  if (!Array.isArray(activities) || activities.length === 0)
    throw new AppError(`No activity found for ${day}!`, 404);

  return activities;
};

const createActivity = async (userId: string, day: Day, activity: any) => {
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

const updateActivity = async (
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

// FOR USERS
export const getMyRoutines = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const routine = await Routine.findOne({ user: req.user.id });
  if (!routine || !routine.allTimeActivities) return next(new AppError('Routines not found!', 404));

  res.status(200).json({
    status: 'success',
    data: routine,
  });
});

export const getMyActivities = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

    const routine = await Routine.findOne({ user: req.user.id });
    if (!routine || !routine[day] || !routine[day].length)
      return next(new AppError(`No activity found for ${day}!`, 404));

    res.status(200).json({
      status: 'success',
      results: routine[day].length,
      data: {
        [day]: routine[day],
      },
    });
  }
);

export const getMyActivity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const day: Day = req.params.day as Day;
  if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

  const routine = await Routine.findOne({ user: req.user.id });
  if (!routine || !routine[day]) return next(new AppError(`No activity found for ${day}!`, 404));

  const activityId = req.params.routineId;
  const activity = routine[day].find(act => act._id.toString() === activityId);
  if (!activity) return next(new AppError('Activity not found!', 404));

  res.status(200).json({
    status: 'success',
    data: activity,
  });
});

export const createMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

    const activity = req.body;
    validateActivityFields(activity);
    isValidTimeFormat(activity.startTime);
    isValidTimeFormat(activity.endTime);

    const newActivity = await createActivity(req.user.id, day, activity);

    res.status(201).json({
      status: 'success',
      data: newActivity,
    });
  }
);

export const updateMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

    const updatedActivity = filterObj(
      req.body,
      'startTime',
      'endTime',
      'activity',
      'category',
      'color'
    );
    if (Object.keys(updatedActivity).length === 0)
      return filterObjError(
        next,
        'At least one of startTime, endTime, activity, category or color must be provided.'
      );

    if (updatedActivity.category && !isValidCategory(updatedActivity.category))
      throw new AppError('Invalid category provided!', 400);

    if (updatedActivity.startTime) isValidTimeFormat(updatedActivity.startTime);
    if (updatedActivity.endTime) isValidTimeFormat(updatedActivity.endTime);

    const activityId = req.params.routineId;

    const activity = await updateActivity(req.user.id, day, activityId, updatedActivity);

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  }
);

export const deleteMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

    const routine = await Routine.findOne({ user: req.user.id });
    if (!routine) return next(new AppError(`No activity found for ${day}!`, 404));

    const activityId = req.params.routineId;
    const activityIndex = routine[day].findIndex(
      activity => activity._id.toString() === activityId
    );
    if (activityIndex === -1) return next(new AppError('Activity not found!', 404));

    const activityToDelete = routine[day][activityIndex];
    if (!activityToDelete) return next(new AppError('Activity not found!', 404));

    routine[day].splice(activityIndex, 1);

    await Activity.findByIdAndDelete(activityToDelete._id);
    await routine.save();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

// FOR ADMINS
export const getAllRoutines = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const features = new APIFeatures<IRoutine>(Routine.find(), req.query, Routine);

    const { results: routines, totalPages, currentPage, totalResults } = await features.paginate();

    if (!routines || !routines.length) return next(new AppError('Routines not found!', 404));

    res.status(200).json({
      status: 'success',
      currentPage,
      totalPages,
      pageResults: routines.length,
      totalResults,
      data: routines,
    });
  }
);

export const getUserRoutines = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    const routines = await Routine.find({ user: userId });
    if (!routines || !routines.length)
      return next(new AppError('No activity found for this user!', 404));

    res.status(200).json({
      status: 'success',
      data: routines,
    });
  }
);

export const getUserActivitiesByDay = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const day: Day = req.params.day as Day;
    const activities = await getRoutineForUserOnDay(userId, day);

    res.status(200).json({
      status: 'success',
      data: activities,
    });
  }
);

// FOR SUPER-ADMINS
export const getUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const day: Day = req.params.day as Day;
    const activities = await getRoutineForUserOnDay(userId, day);

    const { routineId } = req.params;
    const activity = activities.find(activity => activity._id.toString() === routineId);
    if (!activity) return next(new AppError(`Activity not found!`, 404));

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  }
);

export const createUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    if (!isValidDay(day)) throw new AppError('Invalid day provided!', 400);

    const activity = req.body;
    validateActivityFields(activity);
    isValidTimeFormat(activity.startTime);
    isValidTimeFormat(activity.endTime);

    const userId = req.params.userId;
    const newActivity = await createActivity(userId, day, activity);

    res.status(201).json({
      status: 'success',
      data: newActivity,
    });
  }
);

export const updateUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

    const updatedActivity = filterObj(
      req.body,
      'startTime',
      'endTime',
      'activity',
      'category',
      'color'
    );
    if (Object.keys(updatedActivity).length === 0) {
      return filterObjError(
        next,
        'At least one of startTime, endTime, activity, category or color must be provided.'
      );
    }

    if (updatedActivity.category && !isValidCategory(updatedActivity.category))
      throw new AppError('Invalid category provided!', 400);

    if (updatedActivity.startTime) isValidTimeFormat(updatedActivity.startTime);
    if (updatedActivity.endTime) isValidTimeFormat(updatedActivity.endTime);

    const { userId, routineId } = req.params;

    const activity = await updateActivity(userId, day, routineId, updatedActivity);

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  }
);

export const deleteUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    if (!isValidDay(day)) return next(new AppError(`Invalid day: ${day}`, 400));

    const { userId } = req.params;
    let routine = await Routine.findOne({ user: userId });
    if (!routine || !(day in routine))
      return next(new AppError(`No activity found for ${day}!`, 404));

    const { routineId } = req.params;
    const dayRoutines = routine[day as keyof IRoutine] as IActivity[];
    const routineIndex = dayRoutines.findIndex(activity => activity._id.toString() === routineId);
    if (routineIndex === -1) return next(new AppError('Activity not found!', 404));

    const activityToDelete = dayRoutines[routineIndex];
    if (!activityToDelete) return next(new AppError('Activity not found!', 404));

    dayRoutines.splice(routineIndex, 1);

    await Activity.findByIdAndDelete(activityToDelete._id);
    await routine.save();

    res.status(204).json({
      status: 'success',
      message: null,
    });
  }
);

export default {
  getMyRoutines,
  getMyActivities,
  getMyActivity,
  createMyActivity,
  updateMyActivity,
  deleteMyActivity,
  getAllRoutines,
  getUserRoutines,
  getUserActivitiesByDay,
  getUserActivityByDayAndID,
  createUserActivityByDayAndID,
  updateUserActivityByDayAndID,
  deleteUserActivityByDayAndID,
};
