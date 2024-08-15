import { NextFunction, Request, Response } from 'express';

import Gender from '../enums/genderEnum';
import Routine from '../models/routineModel';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

export const getUserStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const totalUsers = await User.countDocuments();
  if (!totalUsers) return next(new AppError('No users found!', 404));

  const activeUsers = await User.countDocuments({ active: true });
  const passiveUsers = await User.countDocuments({ active: false });

  const userStats = await User.aggregate([
    {
      $group: {
        _id: {
          nationality: '$nationality',
          gender: '$gender',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.nationality',
        genders: {
          $push: {
            gender: '$_id.gender',
            count: '$count',
          },
        },
        total: { $sum: '$count' },
      },
    },
  ]);

  const nationalityCounts: Record<
    string,
    { total: number; female: number; male: number; none: number }
  > = {};

  userStats.forEach(
    ({
      _id,
      genders,
      total,
    }: {
      _id: string;
      genders: { gender: Gender; count: number }[];
      total: number;
    }) => {
      nationalityCounts[_id] = {
        total,
        male: 0,
        female: 0,
        none: 0,
      };

      genders.forEach(({ gender, count }) => {
        nationalityCounts[_id][gender] = count;
      });
    }
  );

  res.status(200).json({
    status: 'success',
    data: {
      totalUsers,
      activeUsers,
      passiveUsers,
      nationalityCounts,
    },
  });
});

export const getUserBirthdateStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const birthdateStats = await User.aggregate([
      {
        $group: {
          _id: { $year: '$birthdate' },
          userCount: { $sum: 1 },
        },
      },
      {
        $project: {
          year: '$_id',
          userCount: 1,
          _id: 0,
        },
      },
      {
        $sort: { year: 1 },
      },
    ]);

    const birthdates = birthdateStats.map(({ year, userCount }) => ({
      userCount,
      year,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        birthdates,
      },
    });
  }
);

export const getUserRegistrationStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const registrations = await User.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          userCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
    ]);

    const formattedRegistrations = registrations.map(reg => ({
      year: reg._id.year,
      month: reg._id.month,
      userCount: reg.userCount,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        registrations: formattedRegistrations,
      },
    });
  }
);

export const getRoutineStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const stats = await Routine.aggregate([
      {
        $group: {
          _id: null,
          totalActivities: { $sum: '$allTimeActivities' },
          totalExistingRoutines: {
            $sum: {
              $add: [
                { $size: { $ifNull: ['$monday', []] } },
                { $size: { $ifNull: ['$tuesday', []] } },
                { $size: { $ifNull: ['$wednesday', []] } },
                { $size: { $ifNull: ['$thursday', []] } },
                { $size: { $ifNull: ['$friday', []] } },
                { $size: { $ifNull: ['$saturday', []] } },
                { $size: { $ifNull: ['$sunday', []] } },
              ],
            },
          },
        },
      },
    ]);

    if (!stats.length) return next(new AppError('No routines found!', 404));

    res.status(200).json({
      status: 'success',
      data: {
        totalAllTimeActivities: stats[0].totalActivities,
        totalExistingActivities: stats[0].totalExistingRoutines,
      },
    });
  }
);

export default {
  getUserStats,
  getUserBirthdateStats,
  getUserRegistrationStats,
  getRoutineStats,
};
