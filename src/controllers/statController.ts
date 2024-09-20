import { NextFunction, Request, Response } from 'express';

import Activity from '../models/activityModel';
import CompletedActivity from '../models/completedActivityModel';
import Routine from '../models/routineModel';
import User from '../models/userModel';
import BirthdateStatsType from '../types/statTypes/birthdateStatsType';
import NationalityType from '../types/statTypes/nationalityStatsType';
import RegistrationStatsType from '../types/statTypes/registrationStatsType';
import aggregatePagination from '../utils/aggregatePagination';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

export const getSummaryStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const totalUsers = await User.countDocuments();
    const totalActivities = await Activity.countDocuments();
    const totalAllTimeActivities = await Routine.aggregate([
      {
        $group: {
          _id: null,
          totalActivities: { $sum: '$allTimeActivities' },
        },
      },
    ]);
    const totalCompletedActivities = await CompletedActivity.countDocuments();

    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));

    const newRegistrationsToday = await User.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    const activitiesCompletedToday = await Activity.countDocuments({
      isCompleted: true,
      updatedAt: { $gte: todayStart, $lte: todayEnd },
    });

    const allTimeActivities = totalAllTimeActivities.length
      ? totalAllTimeActivities[0].totalAllTimeActivities
      : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        activeActivities: totalActivities,
        totalCompletedActivities,
        allTimeActivities,
        newRegistrationsToday,
        activitiesCompletedToday,
      },
    });
  }
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
    const userPipeline = User.aggregate([
      {
        $group: {
          _id: {
            nationality: '$nationality.countryName',
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
      totalResults,
    } = await aggregatePagination<NationalityType>(
      User,
      userPipeline,
      +req.query.page! || 1,
      +req.query.limit! || 10
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
      pageResults: Object.keys(nationalityStats).length,
      totalResults,
      data: {
        nationalityStats,
      },
    });
  }
);

export const getUserBirthdateStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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
      totalResults,
    } = await aggregatePagination<BirthdateStatsType>(
      User,
      birthdatePipeline,
      +req.query.page! || 1,
      +req.query.limit! || 10
    );

    if (!birthdateStats.length) return next(new AppError('No users found!', 404));

    res.status(200).json({
      status: 'success',
      currentPage,
      totalPages,
      pageResults: birthdateStats.length,
      totalResults,
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
      totalResults,
    } = await aggregatePagination<RegistrationStatsType>(
      User,
      registrationPipeline,
      +req.query.page! || 1,
      +req.query.limit! || 10
    );

    if (!registration.length) return next(new AppError('No users found!', 404));

    const registrationStats = registration.map((reg: RegistrationStatsType) => ({
      year: reg._id.year,
      month: reg._id.month,
      userCount: reg.userCount,
    }));

    res.status(200).json({
      status: 'success',
      currentPage,
      totalPages,
      pageResults: registrationStats.length,
      totalResults,
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
