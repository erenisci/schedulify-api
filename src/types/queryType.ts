import { Aggregate, Query } from 'mongoose';

type QueryType<T, U> = Query<T[], U> | Aggregate<T[]>;

export default QueryType;
