import { Aggregate, Model, Query } from 'mongoose';

import AppError from './appError';

class APIFeatures<T> {
  model: Model<T>;
  query: Query<T[], T> | Aggregate<T[]>;
  queryString: any;
  page: number;
  limit: number;

  constructor(query: Query<T[], T> | Aggregate<T[]>, queryString: any, model: Model<T>) {
    this.model = model;
    this.query = query;
    this.queryString = queryString;
    this.page = +queryString.page || 1;
    this.limit = +queryString.limit || 10;

    if (this.page <= 0 || this.limit <= 0)
      throw new AppError('Page and limit must be greater than 0.', 400);
  }

  async paginate() {
    const skip = (this.page - 1) * this.limit;

    if (this.query instanceof Query) {
      (this.query as Query<T[], T>).skip(skip).limit(this.limit);
    } else if (this.query instanceof Aggregate) {
      (this.query as Aggregate<T[]>).skip(skip).limit(this.limit);
    }

    const results = await this.query.exec();
    const totalCount = await this.model.countDocuments();
    const totalPages = Math.ceil(totalCount / this.limit);

    if (this.page > totalPages) throw new AppError('Page not found!', 404);

    return { results, totalPages, currentPage: this.page, totalResults: totalCount };
  }
}

export default APIFeatures;
