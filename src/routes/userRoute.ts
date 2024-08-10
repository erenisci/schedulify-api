import express from 'express';
import authController from '../controllers/authController';
import userController from '../controllers/userController';

const router = express.Router();

// FOR EVERYONE
router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);
/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/

// FOR USERS
router.use(authController.restrictTo('user', 'admin', 'super-admin'));

router.route('/logout').post(authController.logout);

// FOR ADMINS (Exclude Passwords)
router.use(authController.restrictTo('admin', 'super-admin'));

router.route('/').get(userController.getAllUsers);
router.route('/:id').get(userController.getUser);

// FOR SUPER-ADMINS (Exclude Passwords)
router.use(authController.restrictTo('super-admin'));

router.route('/').post(userController.createUser);
router
  .route('/:id')
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
