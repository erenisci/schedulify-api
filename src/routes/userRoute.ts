import express from 'express';
import authController from '../controllers/authController';
import userController from '../controllers/userController';

const router = express.Router();

// FOR EVERYONE
router.post('/signup', authController.signup);
router.post('/login', authController.login);
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

router.post('/logout', authController.logout);
router.get('/getMe', userController.getMe);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);
router.patch('/updateMyPassword', authController.updateMyPassword);

// FOR ADMINS (Exclude Passwords)
router.use(authController.restrictTo('admin', 'super-admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);

// FOR SUPER-ADMINS (Exclude Passwords)
router.use(authController.restrictTo('super-admin'));

router.post('/', userController.createUser);
router
  .route('/:id')
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
