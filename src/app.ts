import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';

import errorController from './controllers/errorController';
import xssMiddleware from './middlewares/xssMiddleware';
import routineRoute from './routes/routineRoute';
import statsRoute from './routes/statRoute';
import userRoute from './routes/userRoute';
import AppError from './utils/appError';
import resetCompletedActivities from './cronJobs/resetCompletedActivities';

const app = express();

// CORS
app.use(cors());
app.options('*', cors());

// Set security HTTP headers
app.use(helmet());

// DEV logging
if (process.env.NODE_ENV! === 'development') app.use(morgan('dev'));

// Limit requests from same IP
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(ExpressMongoSanitize());

// Data sanitization against XSS
app.use(xssMiddleware);

// Routes
app.use('/api/v1/users', userRoute);
app.use('/api/v1/routines', routineRoute);
app.use('/api/v1/stats', statsRoute);

// Reset completed activities per user
resetCompletedActivities();

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorController);

export default app;
