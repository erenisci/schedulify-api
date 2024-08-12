import dotenv from 'dotenv';
dotenv.config({ path: './config.env' });

import mongoose from 'mongoose';
import app from './app';

const DB = process.env.DATABASE!.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD!
);

mongoose.connect(DB).then(() => console.log('DB connection successful!'));

const PORT = process.env.PORT!;
app.listen(PORT, () => {
  console.log(`App running on port ${PORT}...`);
});
