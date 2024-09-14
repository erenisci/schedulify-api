import express from 'express';

import authController from '../controllers/authController';
import statsController from '../controllers/statController';

const router = express.Router();

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);

// ADMINS
router.use(authController.restrictTo('admin', 'super-admin'));

// SUMMARY STATS
router.get('/summary-stats', statsController.getSummaryStats);

// ROUTINE STATS
router.get('/activity-stats', statsController.getActivityStats);
router.get('/day-stats', statsController.getDayStats);

// USER STATS
router.get('/nationality-stats', statsController.getNationalityStats);
router.get('/birthdate-stats', statsController.getUserBirthdateStats);
router.get('/registration-stats', statsController.getUserRegistrationStats);

export default router;
