import express from 'express';
import morgan from 'morgan';

import errorController from './controllers/errorController';
import userRoute from './routes/userRoute';
import AppError from './utils/appError';

const app = express();

if (process.env.NODE_ENV! === 'development') app.use(morgan('dev'));

app.use(express.json({ limit: '10kb' }));

app.use('/api/v1/users', userRoute);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

export default app;
