import { Document } from 'mongoose';

type IUser = Document & {
  _id: string;
  name: string;
  email: string;
  nationality: string;
  birthdate: Date;
  gender: string;
  password: string | undefined;
  passwordConfirm?: string | undefined;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  role: 'user' | 'admin' | 'super-admin' | undefined;
  active: boolean | undefined;
  createdAt: Date;
  updatedAt: Date;
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter: (jwtTimestamp: number) => boolean;
  createPasswordResetToken: () => string;
};

export default IUser;
