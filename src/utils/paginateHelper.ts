import { Aggregate, Model } from 'mongoose';

interface PaginationResult<T> {
  results: T[];
  totalPages: number;
  currentPage: number;
}

const paginate = async <T>(
  model: Model<any>,
  pipeline: Aggregate<any> | any[],
  page: number,
  limit: number
): Promise<PaginationResult<T>> => {
  const skip = (page - 1) * limit;

  const countPipeline = Array.isArray(pipeline)
    ? [...pipeline, { $count: 'totalCount' }]
    : [...pipeline.pipeline(), { $count: 'totalCount' }];

  const countResult = await model.aggregate(countPipeline).exec();
  const totalCount = countResult[0]?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / limit);

  if (page > totalPages) throw new Error('Page not found!');

  const resultsPipeline = Array.isArray(pipeline)
    ? [...pipeline, { $skip: skip }, { $limit: limit }]
    : [...pipeline.pipeline(), { $skip: skip }, { $limit: limit }];

  const results = await model.aggregate(resultsPipeline).exec();

  return {
    results,
    totalPages,
    currentPage: page,
  };
};

export default paginate;
