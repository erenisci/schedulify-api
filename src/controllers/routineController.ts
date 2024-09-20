import { NextFunction, Request, Response } from 'express';

import Day from '../enums/dayEnum';
import {
  createActivity,
  getRoutineForUserOnDay,
  updateActivity,
} from '../helpers/routineControllerHelper';
import Activity from '../models/activityModel';
import Routine from '../models/routineModel';
import {
  isValidCategory,
  isValidTimeFormat,
  validateActivityFields,
  validateActivityTimes,
} from '../services/routineService';
import IActivity from '../types/modelTypes/activityType';
import IRoutine from '../types/modelTypes/routineType';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import { filterObj, filterObjError } from '../utils/filter';

// FOR USERS
export const getMyRoutines = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const routine = await Routine.findOne({ userId: req.user.id });
  if (!routine || !routine.allTimeActivities) return next(new AppError('Routines not found!', 404));

  res.status(200).json({
    status: 'success',
    data: routine,
  });
});

export const getMyActivities = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day = req.params.day as Day;
    const routine = await Routine.findOne({ userId: req.user.id });
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

export const createMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const activity = req.body;
    validateActivityFields(activity);
    validateActivityTimes(activity);

    const day = req.params.day as Day;
    const newActivity = await createActivity(req.user.id, day, activity);

    res.status(201).json({
      status: 'success',
      data: newActivity,
    });
  }
);

export const getMyActivity = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const day: Day = req.params.day as Day;
  const routine = await Routine.findOne({ userId: req.user.id });
  if (!routine || !routine[day]) return next(new AppError(`No activity found for ${day}!`, 404));

  const activityId = req.params.routineId;
  const activity = routine[day].find(act => act._id.toString() === activityId);
  if (!activity) return next(new AppError('Activity not found!', 404));

  res.status(200).json({
    status: 'success',
    data: activity,
  });
});

export const updateMyActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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

    const day = req.params.day as Day;
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
    const day = req.params.day as Day;
    const routine = await Routine.findOne({ userId: req.user.id });
    if (!routine) return next(new AppError(`No activity found for ${day}!`, 404));

    const activityId = req.params.routineId;
    const activityIndex = routine[day].findIndex(
      activity => activity._id.toString() === activityId
    );
    if (activityIndex === -1) return next(new AppError(`No activity found for ${day}!`, 404));

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
    const routines = await Routine.find({ userId });
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
    const activity = req.body;
    validateActivityFields(activity);
    validateActivityTimes(activity);

    const userId = req.params.userId;
    const day = req.params.day as Day;
    const newActivity = await createActivity(userId, day, activity);

    res.status(201).json({
      status: 'success',
      data: newActivity,
    });
  }
);

export const updateUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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

    const { userId, routineId } = req.params;
    const day = req.params.day as Day;
    const activity = await updateActivity(userId, day, routineId, updatedActivity);

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  }
);

export const deleteUserActivityByDayAndID = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;
    const day = req.params.day as Day;
    let routine = await Routine.findOne({ userId });
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
