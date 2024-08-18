import { NextFunction, Request, Response } from 'express';

import Gender from '../enums/genderEnum';
import Activity from '../models/activityModel';
import Routine from '../models/routineModel';
import User from '../models/userModel';
import APIFeatures from '../utils/apiFeatures';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

export const getSummaryStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

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
              else: { $divide: ['$totalDuration', '$totalActivity'] },
            },
          },
        },
      },
      {
        $sort: { totalDuration: -1 },
      },
    ]);

    if (!activityStats.length) return next(new AppError('No activities found!', 404));

    res.status(200).json({
      status: 'success',
      results: activityStats.length,
      data: {
        activityStats,
      },
    });
  }
);

export const getDayStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {}
);

// const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export const getNationalityStats = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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

    const features = new APIFeatures(userPipeline, req.query, User);
    const { results: userStats, totalPages, currentPage } = await features.paginate();

    if (!userStats.length) return next(new AppError('No users found!', 404));

    const nationalityStats: Record<
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
        nationalityStats[_id] = {
          total,
          male: 0,
          female: 0,
          none: 0,
        };

        genders.forEach(({ gender, count }) => {
          nationalityStats[_id][gender] = count;
        });
      }
    );

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

    const features = new APIFeatures(birthdatePipeline, req.query, User);
    const { results: birthdateStats, totalPages, currentPage } = await features.paginate();

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

    const features = new APIFeatures(registrationPipeline, req.query, User);
    const { results: registration, totalPages, currentPage } = await features.paginate();

    if (!registration.length) return next(new AppError('No users found!', 404));

    const registrationStats = registration.map(reg => ({
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
