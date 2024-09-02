import { NextFunction, Request, Response } from 'express';

import Activity from '../models/activityModel';
import Routine from '../models/routineModel';
import User from '../models/userModel';
import BirthdateType from '../types/birthdateType';
import NationalityType from '../types/nationalityType';
import RegistrationType from '../types/registrationType';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import paginateHelper from '../utils/paginateHelper';

export const getSummaryStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

export const getDayStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const dayStats = await Routine.aggregate([
    {
      $project: {
        days: {
          monday: '$monday',
          tuesday: '$tuesday',
          wednesday: '$wednesday',
          thursday: '$thursday',
          friday: '$friday',
          saturday: '$saturday',
          sunday: '$sunday',
        },
      },
    },
    {
      $project: {
        dayActivities: {
          $objectToArray: '$days',
        },
      },
    },
    {
      $unwind: '$dayActivities',
    },
    {
      $unwind: '$dayActivities.v',
    },
    {
      $group: {
        _id: {
          day: '$dayActivities.k',
          category: '$dayActivities.v.category',
        },
        totalActivities: { $sum: 1 },
        totalDuration: { $sum: '$dayActivities.v.duration' },
      },
    },
    {
      $group: {
        _id: '$_id.day',
        totalActivities: { $sum: '$totalActivities' },
        categories: {
          $push: {
            categoryName: '$_id.category',
            duration: '$totalDuration',
          },
        },
      },
    },
    {
      $addFields: {
        sortOrder: {
          $indexOfArray: [
            ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            '$_id',
          ],
        },
      },
    },
    {
      $addFields: {
        categories: {
          $sortArray: { input: '$categories', sortBy: { duration: -1 } },
        },
      },
    },
    {
      $sort: { sortOrder: 1 },
    },
  ]);

  if (!dayStats || !dayStats.length) return next(new AppError('No activities found!', 404));

  res.status(200).json({
    status: 'success',
    data: dayStats.reduce((acc, stat) => {
      acc[stat._id] = {
        totalActivities: stat.totalActivities,
        categories: stat.categories,
      };
      return acc;
    }, {} as Record<string, { totalActivities: number; categories: { categoryName: string; duration: number }[] }>),
  });
});

export const getActivityStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const activityStats = await Activity.aggregate([
      {
        $group: {
          _id: '$category',
          totalDuration: { $sum: '$duration' },
          totalActivity: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          categoryName: '$_id',
          totalDuration: 1,
          totalActivity: 1,
          durationPerActivity: {
            $cond: {
              if: { $eq: ['$totalActivity', 0] },
              then: 0,
              else: {
                $round: [{ $divide: ['$totalDuration', '$totalActivity'] }, 2],
              },
            },
          },
        },
      },
      {
        $sort: { totalDuration: -1 },
      },
    ]);

    if (!activityStats || !activityStats.length)
      return next(new AppError('No activities found!', 404));

    res.status(200).json({
      status: 'success',
      results: activityStats.length,
      data: {
        activityStats,
      },
    });
  }
);

export const getNationalityStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const limit = +req.query.limit! || 10;
    const page = +req.query.page! || 1;

    const userPipeline = User.aggregate([
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

    const {
      results: userStats,
      totalPages,
      currentPage,
    } = await paginateHelper<NationalityType>(
      User,
      userPipeline,
      +req.query.page! ?? 1,
      +req.query.limit! ?? 10
    );

    if (!userStats.length) return next(new AppError('No users found!', 404));

    const nationalityStats: Record<
      string,
      { total: number; female: number; male: number; none: number }
    > = {};

    userStats.forEach(({ _id, genders, total }: NationalityType) => {
      nationalityStats[_id] = {
        total,
        male: 0,
        female: 0,
        none: 0,
      };

      genders.forEach(({ gender, count }) => {
        nationalityStats[_id][gender] = count;
      });
    });

    res.status(200).json({
      status: 'success',
      currentPage,
      totalPages,
      results: Object.keys(nationalityStats).length,
      data: {
        nationalityStats,
      },
    });
  }
);

export const getUserBirthdateStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const limit = +req.query.limit! || 10;
    const page = +req.query.page! || 1;

    const birthdatePipeline = User.aggregate([
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

    const {
      results: birthdateStats,
      totalPages,
      currentPage,
    } = await paginateHelper<BirthdateType>(
      User,
      birthdatePipeline,
      +req.query.page! ?? 1,
      +req.query.limit! ?? 10
    );

    if (!birthdateStats.length) return next(new AppError('No users found!', 404));

    res.status(200).json({
      status: 'success',
      currentPage,
      totalPages,
      results: birthdateStats.length,
      data: {
        birthdateStats,
      },
    });
  }
);

export const getUserRegistrationStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const registrationPipeline = User.aggregate([
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
        $sort: { '_id.year': 1, '_id.month': -1 },
      },
    ]);

    const {
      results: registration,
      totalPages,
      currentPage,
    } = await paginateHelper<RegistrationType>(
      User,
      registrationPipeline,
      +req.query.page! ?? 1,
      +req.query.limit! ?? 10
    );

    if (!registration.length) return next(new AppError('No users found!', 404));

    const registrationStats = registration.map((reg: RegistrationType) => ({
      year: reg._id.year,
      month: reg._id.month,
      userCount: reg.userCount,
    }));

    res.status(200).json({
      status: 'success',
      currentPage,
      totalPages,
      results: registrationStats.length,
      data: {
        registrationStats,
      },
    });
  }
);

export default {
  getSummaryStats,
  getActivityStats,
  getDayStats,
  getNationalityStats,
  getUserBirthdateStats,
  getUserRegistrationStats,
};
