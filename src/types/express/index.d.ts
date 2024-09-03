import { IUser } from '../modelTypes/userType';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
