import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import validator from 'validator';
import Routine from '../models/routineModel';
import Day from '../types/dayType';
import IRoutine, { Activity } from '../types/routineType';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { filterObj, filterObjError } from '../utils/filter';

const validDays: Day[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const validateTimeFormat = (time: string) => {
  const timeFormat = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!validator.matches(time, timeFormat))
    throw new AppError('Time must be in HH:mm format!', 400);
};

const isValidDay = (day: string): day is Day => {
  return validDays.includes(day as Day);
};

const getRoutineForUserOnDay = async (userId: string, day: string) => {
  if (!isValidDay(day)) throw new AppError('Invalid day provided!', 400);

  const routine = await Routine.findOne({ user: userId });
  if (!routine) throw new AppError(`No activity found for ${day}!`, 404);

  const activities = routine[day as keyof IRoutine] as Activity[] | undefined;
  if (!Array.isArray(activities) || activities.length === 0)
    throw new AppError(`No activity found for ${day}!`, 404);

  return activities;
};

const validateActivityFields = (activity: Partial<Activity>) => {
  if (!activity || !activity.time || !activity.activity)
    throw new AppError('Both time and activity fields are required!', 400);
};

// FOR USERS
export const getMyRoutines = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const routine = await Routine.findOne({ user: req.user.id });

    if (!routine || !routine.allTimeActivities)
      return next(new AppError('No activity found for this user!', 404));

    res.status(200).json({
      status: 'success',
      data: routine,
    });
  }
);

export const getMyActivities = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;

    const routine = await Routine.findOne({ user: req.user.id });

    if (!routine || !routine[day])
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

export const getMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;

    const routine = await Routine.findOne({ user: req.user.id });

    if (!routine || !routine[day])
      return next(new AppError(`No activity found for ${day}!`, 404));

    const activityId = req.params.id;
    const activity = routine[day].find(
      act => act._id.toString() === activityId
    );

    if (!activity) return next(new AppError('Activity not found!', 404));

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  }
);

export const createMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;

    let routine = await Routine.findOne({ user: req.user.id });

    const activity = req.body;
    validateActivityFields(activity);
    validateTimeFormat(activity.time);

    const newActivity: Activity = {
      _id: new mongoose.Types.ObjectId(),
      time: activity.time,
      activity: activity.activity,
    };

    if (!routine) {
      routine = await Routine.create({
        user: req.user.id,
        [day]: [newActivity],
        allTimeActivities: 1,
      });
    } else {
      routine[day].push(newActivity);
      routine.allTimeActivities += 1;
    }

    await routine.save();

    res.status(200).json({
      status: 'success',
      data: newActivity,
    });
  }
);

export const updateMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const updatedActivity = filterObj(req.body, 'time', 'activity');

    if (Object.keys(updatedActivity).length === 0) return filterObjError(next);

    if (updatedActivity.time) validateTimeFormat(updatedActivity.time);

    const day: Day = req.params.day as Day;
    const routine = await Routine.findOne({ user: req.user.id });
    if (!routine)
      return next(new AppError(`No activity found for ${day}!`, 404));

    const activityId: string = req.params.id;

    const activityIndex = routine[day].findIndex(
      activity => activity._id.toString() === activityId
    );
    if (activityIndex === -1)
      return next(new AppError('Activity not found!', 404));

    const currentActivity = routine[day][activityIndex];

    routine[day][activityIndex] = {
      _id: currentActivity._id,
      time: updatedActivity.time ? updatedActivity.time : currentActivity.time,
      activity: updatedActivity.activity
        ? updatedActivity.activity
        : currentActivity.activity,
    };

    await routine.save();

    res.status(200).json({
      status: 'success',
      data: routine[day][activityIndex],
    });
  }
);

export const deleteMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;

    const routine = await Routine.findOne({ user: req.user.id });
    if (!routine)
      return next(new AppError(`No activity found for ${day}!`, 404));

    const activityId: string = req.params.id;

    const activityIndex = routine[day].findIndex(
      activity => activity._id.toString() === activityId
    );

    if (activityIndex === -1)
      return next(new AppError('Activity not found!', 404));

    routine[day].splice(activityIndex, 1);

    await routine.save();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

// FOR ADMINS
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
    const { userId, day } = req.params;

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
    const { userId, day, routineId } = req.params;

    const activities = await getRoutineForUserOnDay(userId, day);

    const activity = activities.find(
      activity => activity._id.toString() === routineId
    );

    if (!activity)
      return next(
        new AppError(`No activity found with ID ${routineId} on ${day}!`, 404)
      );

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  }
);

export const createUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, day } = req.params;

    if (!isValidDay(day)) throw new AppError('Invalid day provided!', 400);

    const activity = req.body;
    validateActivityFields(activity);
    validateTimeFormat(activity.time);

    let routine = await Routine.findOne({ user: userId });

    const newActivity: Activity = {
      _id: new mongoose.Types.ObjectId(),
      time: activity.time,
      activity: activity.activity,
    };

    if (!routine) {
      routine = await Routine.create({
        user: userId,
        [day]: [newActivity],
        allTimeActivities: 1,
      });
    } else {
      (routine[day as keyof IRoutine] as Activity[]).push(newActivity);
      routine.allTimeActivities += 1;
    }

    await routine.save();

    res.status(201).json({
      status: 'success',
      data: newActivity,
    });
  }
);

export const updateUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, routineId } = req.params;

    const updatedActivity = filterObj(req.body, 'time', 'activity');

    if (Object.keys(updatedActivity).length === 0) return filterObjError(next);

    if (updatedActivity.time) validateTimeFormat(updatedActivity.time);

    const day: Day = req.params.day as Day;

    let routine = await Routine.findOne({ user: userId });
    if (!routine || !routine[day])
      return next(new AppError(`No activity found for ${day}!`, 404));

    const dayRoutines = routine[day] as Activity[];

    const routineIndex = dayRoutines.findIndex(
      activity => activity._id.toString() === routineId
    );

    if (routineIndex === -1)
      return next(new AppError('Activity not found!', 404));

    const currentActivity = dayRoutines[routineIndex];

    dayRoutines[routineIndex] = {
      _id: currentActivity._id,
      time: updatedActivity.time ? updatedActivity.time : currentActivity.time,
      activity: updatedActivity.activity
        ? updatedActivity.activity
        : currentActivity.activity,
    };

    await routine.save();

    res.status(200).json({
      status: 'success',
      data: dayRoutines[routineIndex],
    });
  }
);

export const deleteUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId, day, routineId } = req.params;

    let routine = await Routine.findOne({ user: userId });

    if (!routine || !(day in routine))
      return next(new AppError(`No activity found for ${day}!`, 404));

    const dayRoutines = routine[day as keyof IRoutine] as Activity[];

    const routineIndex = dayRoutines.findIndex(
      activity => activity._id.toString() === routineId
    );

    if (routineIndex === -1)
      return next(new AppError('Activity not found!', 404));

    dayRoutines.splice(routineIndex, 1);

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
  getUserRoutines,
  getUserActivitiesByDay,
  getUserActivityByDayAndID,
  createUserActivityByDayAndID,
  updateUserActivityByDayAndID,
  deleteUserActivityByDayAndID,
};
