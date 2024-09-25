import express from 'express';

import authController from '../controllers/authController';
import feedbackTicketController from '../controllers/feedbackTicketController';
import validateTicketId from '../middlewares/validateTicketId';

const router = express.Router();

/* 
----- PROTECT ROUTES FOR ONLY ACCOUNTS -----
*/
router.use(authController.protect);

// FOR USERS
router.use(authController.restrictTo('user', 'admin', 'super-admin'));

router.get('/', feedbackTicketController.getMyTickets);
router.post('/', feedbackTicketController.createFeedbackTicket);

// FOR ADMINS
router.use(authController.restrictTo('admin', 'super-admin'));

router.get('/tickets', feedbackTicketController.getTickets);
router.patch(
  '/tickets/closed/:ticketId',
  validateTicketId,
  feedbackTicketController.markTicketAsClosed
);
router.patch(
  '/tickets/unclosed/:ticketId',
  validateTicketId,
  feedbackTicketController.markTicketAsUnclosed
);

// FOR SUPER-ADMINS
router.use(authController.restrictTo('super-admin'));

router.get('/feedbacks', feedbackTicketController.getFeedbacks);

export default router;
