import express from 'express';

import authController from '../controllers/authController';
import statsController from '../controllers/statsController';

const router = express.Router();

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);

// ADMINS
router.use(authController.restrictTo('admin', 'super-admin'));

router.get('/user-stats', statsController.getUserStats);
router.get('/birthdate-stats', statsController.getUserBirthdateStats);
router.get('/registration-stats', statsController.getUserRegistrationStats);
router.get('/routine-stats', statsController.getRoutineStats);

export default router;
