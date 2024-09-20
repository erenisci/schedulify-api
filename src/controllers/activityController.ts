import { NextFunction, Request, Response } from 'express';

import Activity from '../models/activityModel';
import CompletedActivity from '../models/completedActivityModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

export const addMyActivityMark = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { activityId } = req.params;
    const activity = await Activity.findById(activityId);
    if (!activity) return next(new AppError('No activity found with that ID', 404));

    if (String(activity.userId) !== req.user.id)
      return next(new AppError('You do not have permission to modify this activity.', 403));

    activity.isCompleted = true;
    await activity.save();

    await CompletedActivity.create({
      activityId: activity._id,
      activity: activity.activity,
      duration: activity.duration,
      category: activity.category,
    });

    res.status(200).json({
      status: 'success',
      data: {
        activity,
      },
    });
  }
);

export const deleteMyActivityMark = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { activityId } = req.params;
    const activity = await Activity.findById(activityId);

    if (!activity) return next(new AppError('No activity found with that ID', 404));

    if (String(activity.userId) !== req.user.id)
      return next(new AppError('You do not have permission to modify this activity.', 403));

    activity.isCompleted = false;
    await activity.save();

    await CompletedActivity.findOneAndDelete({ activityId: activityId });

    res.status(204).json({
      status: 'success',
      data: {
        activity,
      },
    });
  }
);

export default {
  addMyActivityMark,
  deleteMyActivityMark,
};
