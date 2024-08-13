import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import IUser from '../types/userType';
import APIFeatures from '../utils/apiFeatures';

const filterObj = (obj: Record<string, any>, ...allowedFields: string[]) => {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// FOR USERS
export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.user.id).select(
      '-password -passwordChangedAt -passwordResetExpires -passwordResetToken -role -active'
    );

    res.status(200).json({
      status: 'success',
      data: user,
    });
  }
);

export const updateMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.password || req.body.passwordConfirm)
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword',
          400
        )
      );

    const filteredBody = filterObj(req.body, 'name', 'email');

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser,
      },
    });
  }
);

export const deleteMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

// FOR ADMINS
export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const features = new APIFeatures<IUser, IUser>(
      User.find().select('-password'),
      req.query
    ).paginate();

    const users = await features.query;

    if (!users || !users.length)
      return next(new AppError('Users not found!', 404));

    res.status(200).json({
      status: 'success',
      results: users.length,
      data: users,
    });
  }
);

export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) return next(new AppError('User not found!', 404));

    res.status(200).json({
      status: 'success',
      data: user,
    });
  }
);

// FOR SUPER-ADMINS!!
export const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const newUser = await User.create(req.body);

    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      data: newUser,
    });
  }
);

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filteredBody = filterObj(
      req.body,
      'name',
      'surname',
      'email',
      'password',
      'role'
    );

    if (!filteredBody || Object.keys(filteredBody).length === 0)
      return next(
        new AppError(
          'You must provide at least one field to update: name, surname, email, or password.',
          404
        )
      );

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password');

    if (!updatedUser) return next(new AppError('User not found!', 404));

    res.status(200).json({
      status: 'success',
      updatedFields: Object.keys(filteredBody),
      data: {
        user: updatedUser,
      },
    });
  }
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    await User.findByIdAndUpdate(req.params.id, { active: false });

    res.status(204).json({
      status: 'success',
      data: null,
    });
  }
);

export default {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getMe,
  updateMe,
  deleteMe,
};
