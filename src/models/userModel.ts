import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose, { Model } from 'mongoose';
import validator from 'validator';

import IUser from '../types/userType';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  surname: {
    type: String,
    required: [true, 'Surname is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email!'],
  },
  nationality: {
    type: String,
    required: [true, 'Nationality is required'],
  },
  birthdate: {
    type: Date,
    required: [true, 'Birthdate is required'],
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'none'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    minlength: 8,
    validate: {
      validator: function (this: IUser, el: string): boolean {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: {
    type: String,
  },
  passwordResetExpires: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'super-admin'],
    default: 'user',
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
});

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password as string, 12);

  this.passwordConfirm = undefined;

  next();
});

// Hash for only admin updates
userSchema.pre<mongoose.Query<IUser, IUser>>(
  'findOneAndUpdate',
  async function (next: Function) {
    const update = this.getUpdate() as Partial<IUser>;

    if (update.password) {
      update.password = await bcrypt.hash(update.password, 12);
    }

    next();
  }
);

userSchema.pre<IUser>('save', function (next: Function) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp: number) {
  if (this.passwordChangedAt) {
    const changedTimestamp = this.passwordChangedAt.getTime() / 1000;
    return JWTTimestamp < changedTimestamp;
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.pre<IUser>('findOneAndUpdate', function (next: Function) {
  this.updatedAt = new Date(Date.now());
  next();
});

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
