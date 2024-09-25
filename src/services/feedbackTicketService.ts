import { Request } from 'express';

export const getPaginationParams = (req: Request) => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = parseInt(req.query.limit as string, 10) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};
