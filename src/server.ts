import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import mongoose from 'mongoose';

import app from './app';
import AppError from './utils/appError';

process.on('uncaughtException', (err: AppError) => {
  console.log('UNCAUGHT EXCEPTION! ⛔ Shutting Down...');
  console.log(err.name, err.message);
  process.exit(1);
});

const DB = process.env.DATABASE!.replace('<PASSWORD>', process.env.DATABASE_PASSWORD!);

mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const PORT = process.env.PORT!;
const server = app.listen(PORT, () => {
  console.log(`App running on port ${PORT}...`);
});

process.on('unhandledRejection', (err: AppError) => {
  console.log(err.name, err.message);
  console.log('UNHANDLED REJECTION! ⛔ Shutting Down...');
  server.close(() => {
    process.exit(1);
  });
});
