import express from 'express';

import authController from '../controllers/authController';
import userController from '../controllers/userController';

const router = express.Router();

// FOR EVERYONE
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);

// FOR USERS
router.use(authController.restrictTo('user', 'admin', 'super-admin'));

router.post('/logout', authController.logout);
router.get('/get-me', userController.getMe);
router.patch('/update-me', userController.updateMe);
router.delete('/delete-me', userController.deleteMe);
router.patch('/update-my-password', authController.updateMyPassword);

// FOR ADMINS (Exclude Passwords)
router.use(authController.restrictTo('admin', 'super-admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);

// FOR SUPER-ADMINS (Exclude Passwords)
router.use(authController.restrictTo('super-admin'));

router.post('/', userController.createUser);
router.route('/:id').patch(userController.updateUser).delete(userController.deleteUser);

export default router;
