import { NextFunction, Request, Response } from 'express';
import User from '../models/userModel';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';

const filterObj = (obj: Record<string, any>, allowedFields: string[]) => {
  const newObj: Record<string, any> = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// FOR ADMINS
export const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users = await User.find().select('-password');

    if (!users || !users.length)
      return next(new AppError('Users not found!', 404));

    res.status(200).json({
      status: 'success',
      length: users.length,
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
    const filteredBody = filterObj(req.body, [
      'name',
      'surname',
      'email',
      'password',
      'role',
    ]);

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
};
