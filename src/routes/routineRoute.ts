import express from 'express';
import authController from '../controllers/authController';
import routineController from '../controllers/routineController';

const router = express.Router();

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);

// FOR USERS
router.use(authController.restrictTo('user', 'admin', 'super-admin'));

router
  .route('/myRoutines/:day')
  .get(routineController.getActivities)
  .post(routineController.createActivity);

router
  .route('/myRoutines/:day/:id')
  .get(routineController.getActivity)
  .patch(routineController.updateActivity)
  .delete(routineController.deleteActivity);

// FOR ADMINS
router.use(authController.restrictTo('admin', 'super-admin'));

router.get('/:userId', routineController.getUserRoutines);
router.get('/:userId/:day', routineController.getUserRoutinesByDay);

// FOR SUPER-ADMINS
router.use(authController.restrictTo('super-admin'));

router.post('/:userId/:day', routineController.createUserRoutinesByDayById);

router
  .route('/:userId/:day/:routineId')
  .get(routineController.getUserRoutinesByDayById)
  .patch(routineController.updateUserRoutinesByDayById)
  .delete(routineController.deleteUserRoutinesByDayById);

export default router;
