import { NextFunction, Request, Response } from 'express';
import validator from 'validator';
import Routine from '../models/routineModel';
import Day from '../types/dayType';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

const validateTimeFormat = (time: string) => {
  const timeFormat = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!validator.matches(time, timeFormat)) {
    throw new AppError('Time must be in HH:mm format!', 400);
  }
};

// FOR USERS
export const getActivities = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    const routine = await Routine.findOne({ user: req.user.id });

    if (!routine || !routine[day])
      return next(new AppError(`No routine found for ${day}!`, 404));

    res.status(200).json({
      status: 'success',
      results: routine[day].length,
      data: {
        [day]: routine[day],
      },
    });
  }
);

export const getActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;

    const routine = await Routine.findOne({ user: req.user.id });
    if (!routine || !routine[day])
      return next(new AppError(`No routine found for ${day}!`, 404));

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

export const createActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    let routine = await Routine.findOne({ user: req.user.id });

    const activity = req.body;

    if (!activity || !activity.time || !activity.activity)
      return next(
        new AppError('Both time and activity fields are required!', 400)
      );

    validateTimeFormat(activity.time);

    if (!routine) {
      routine = await Routine.create({
        user: req.user.id,
        [day]: [activity],
        allTimeActivities: 1,
      });
    } else {
      routine[day].push(activity);
      routine.allTimeActivities += 1;
    }

    await routine.save();

    res.status(200).json({
      status: 'success',
      data: activity,
    });
  }
);

export const updateActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newActivity = req.body;

    if (!newActivity || !newActivity.activity || !newActivity.time)
      return next(
        new AppError('Both activity and time fields are required!', 400)
      );

    validateTimeFormat(newActivity.time);

    const routine = await Routine.findOne({ user: req.user.id });
    if (!routine)
      return next(new AppError('No routine found for this user!', 404));

    const day: Day = req.params.day as Day;
    const activityId: string = req.params.id;

    const activityIndex = routine[day].findIndex(
      activity => activity._id.toString() === activityId
    );
    if (activityIndex === -1)
      return next(new AppError('Activity not found!', 404));

    routine[day][activityIndex] = {
      ...newActivity,
      _id: routine[day][activityIndex]._id,
    };

    await routine.save();

    res.status(200).json({
      status: 'success',
      data: newActivity,
    });
  }
);

export const deleteActivity = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const day: Day = req.params.day as Day;
    const activityId: string = req.params.id;

    const routine = await Routine.findOne({ user: req.user.id });

    if (!routine)
      return next(new AppError('No routine found for this user!', 404));

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
/* 
----- NO ADMIN ROUTES FOR NOW -----
*/

// FOR SUPER-ADMINS
export const getAllRoutines = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const routines = await Routine.find();

    if (!routines || !routines.length)
      return next(new AppError('No routines found!', 404));

    res.status(200).json({
      status: 'success',
      results: routines.length,
      data: routines,
    });
  }
);

export default {
  getActivities,
  getActivity,
  createActivity,
  updateActivity,
  deleteActivity,
  getAllRoutines,
};
