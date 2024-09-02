import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

import User from '../models/userModel';
import Cookie from '../types/cookieType';
import IUser from '../types/userType';
import AppError from '../utils/appError';
import catchAsync from '../utils/catchAsync';
import sendEmail from '../utils/email';

export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role))
      return next(new AppError('You do not have permission to perform this action!', 403));

    next();
  };
};

const jwtVerifyPromisified = (token: string, secret: string): Promise<JwtPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, {}, (err, payload) => {
      if (err) reject(err);
      else resolve(payload as JwtPayload);
    });
  });
};

const signToken = (id: string) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user: IUser, message: string, statusCode: number, res: Response) => {
  const token = signToken(user._id);

  const cookieOptions: Cookie = {
    expires: new Date(Date.now() + +process.env.JWT_COOKIE_EXPIRES_IN! * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };

  if (process.env.NODE_ENV! === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.active = undefined;
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    message,
    token,
    data: user,
  });
};

export const signup = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  req.body.role = 'user';
  const newUser = await User.create(req.body);

  const message = 'You have successfully signed up!';
  createSendToken(newUser, message, 201, res);
});

export const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) return next(new AppError('Please provide email and password!', 400));

  const user = await User.findOne({ email: email }).select('+password');
  if (!user || !user.password) return next(new AppError('Invalid email or password!', 401));

  const isPasswordCorrect = await user.correctPassword(password, user.password);
  if (!isPasswordCorrect) return next(new AppError('Invalid email or password!', 401));

  if (!user.active)
    return next(new AppError('Your account is inactive. Please contact with support.', 403));

  const message = 'You have successfully logged in!';
  createSendToken(user, message, 200, res);
});

export const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'You have successfully logged out!',
  });
});

export const forgotPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;
    if (!email) return next(new AppError('Please provide email!', 400));

    const user = await User.findOne({ email });
    if (!user) return next(new AppError('There is no user with email address.', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;

    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Schedulify password reset token (valid for 10 min)',
        message: message,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token sent to email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending the email. Try again later!', 500));
    }
  }
);

export const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError('Token is invalid or has expired!', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const message = 'Your password has been successfully reset!';
  createSendToken(user, message, 200, res);
});

export const updateMyPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { passwordCurrent, passwordNew, passwordConfirm } = req.body;

    if (!passwordCurrent || !passwordNew || !passwordConfirm)
      return next(new AppError('Please provide all password fields.', 400));

    const user = await User.findById(req.user.id).select('+password');
    if (!user || !(await user!.correctPassword(req.body.passwordCurrent, user!.password as string)))
      return next(new AppError('Your current password is wrong!', 401));

    user.password = req.body.passwordNew;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    const message = 'Your password has been successfully updated!';
    createSendToken(user, message, 200, res);
  }
);

export const protect = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer'))
    token = req.headers.authorization.split(' ')[1];
  else if (req.cookies.jwt) token = req.cookies.jwt;

  if (!token) return next(new AppError('You are not logged in! Please log in to get access.', 401));

  const decoded = await jwtVerifyPromisified(token, process.env.JWT_SECRET!);

  const currentUser = (await User.findById((decoded as JwtPayload).id)) as IUser;
  if (!currentUser)
    return next(new AppError('The user belonging to this token does no longer exist.', 401));

  if (decoded.iat && currentUser.changedPasswordAfter(decoded.iat))
    return next(new AppError('User recently changed password! Please log in again', 401));

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

export default {
  restrictTo,
  signup,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updateMyPassword,
  protect,
};
