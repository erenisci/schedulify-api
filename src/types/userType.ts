import { Document } from 'mongoose';

type IUser = Document & {
  _id: string;
  name: string;
  email: string;
  password: string | undefined;
  passwordConfirm?: string | undefined;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  role: 'user' | 'admin';
  active: boolean | undefined;
  createdAt: Date;
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter: (jwtTimestamp: number) => boolean;
  createPasswordResetToken: () => string;
};

export default IUser;
