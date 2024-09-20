import express from 'express';

import activityController from '../controllers/activityController';
import authController from '../controllers/authController';
import validateActivityId from '../middlewares/validateActivityId';

const router = express.Router();

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);

// FOR USERS
router.use(authController.restrictTo('user', 'admin', 'super-admin'));

router.patch('/addMark/:activityId', validateActivityId, activityController.addMyActivityMark);
router.delete(
  '/deleteMark/:activityId',
  validateActivityId,
  activityController.deleteMyActivityMark
);

export default router;
