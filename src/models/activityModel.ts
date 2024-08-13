import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  time: {
    type: String,
    required: true,
  },
  activity: {
    type: String,
    required: true,
  },
});

export default activitySchema;
