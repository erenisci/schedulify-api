import express from 'express';

import authController from '../controllers/authController';
import routineController from '../controllers/routineController';
import validateDay from '../middlewares/validateDayMiddleware';
import validateRoutineId from '../middlewares/validateRoutineId';
import validateUserId from '../middlewares/validateUserId';

const router = express.Router();

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);

// FOR USERS
router.use(authController.restrictTo('user', 'admin', 'super-admin'));

router.get('/my-routines', routineController.getMyRoutines);

router
  .route('/my-routines/:day')
  .all(validateDay)
  .get(routineController.getMyActivities)
  .post(routineController.createMyActivity);

router
  .route('/my-routines/:day/:routineId')
  .all(validateDay)
  .all(validateRoutineId)
  .get(routineController.getMyActivity)
  .patch(routineController.updateMyActivity)
  .delete(routineController.deleteMyActivity);

// FOR ADMINS
router.use(authController.restrictTo('admin', 'super-admin'));

router.get('/', routineController.getAllRoutines);
router.get('/:userId', validateUserId, routineController.getUserRoutines);
router.get('/:userId/:day', validateUserId, validateDay, routineController.getUserActivitiesByDay);

// FOR SUPER-ADMINS
router.use(authController.restrictTo('super-admin'));

router.post(
  '/:userId/:day',
  validateUserId,
  validateDay,
  routineController.createUserActivityByDayAndID
);

router
  .route('/:userId/:day/:routineId')
  .all(validateUserId)
  .all(validateDay)
  .all(validateRoutineId)
  .get(routineController.getUserActivityByDayAndID)
  .patch(routineController.updateUserActivityByDayAndID)
  .delete(routineController.deleteUserActivityByDayAndID);

export default router;
