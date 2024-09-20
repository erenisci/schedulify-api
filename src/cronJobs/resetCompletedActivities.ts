import cron from 'node-cron';
import moment from 'moment-timezone';

import Activity from '../models/activityModel';
import User from '../models/userModel';

const resetCompletedActivities = () => {
  cron.schedule('0 * * * *', async () => {
    const users = await User.find();

    let activitiesReset = false,
      timeZone = '';
    for (const user of users) {
      const userTimeZone = user.timeZone || 'UTC';
      const nowInUserTimeZone = moment.tz(userTimeZone).format('HH:mm');

      if (nowInUserTimeZone === '00:00') {
        await Activity.updateMany({ userId: user._id }, { isCompleted: false });
        activitiesReset = true;
        timeZone = userTimeZone;
      }
    }

    if (activitiesReset)
      console.log(`Activities have been reset for the user in the ${timeZone} timezone.`);
  });
};

export default resetCompletedActivities;
