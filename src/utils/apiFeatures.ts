import { Query } from 'mongoose';

class APIFeatures<T, U> {
  query: Query<T[], U>;
  queryString: any;

  constructor(query: Query<T[], U>, queryString: any) {
    this.query = query;
    this.queryString = queryString;
  }

  paginate() {
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

export default APIFeatures;
