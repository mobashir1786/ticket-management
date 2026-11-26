const express = require('express');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const ticketController = require('../controllers/ticketController');
const commentController = require('../controllers/commentController');
const {
  createTicketSchema,
  listTicketsSchema,
  ticketIdSchema,
  userUpdateSchema,
  adminUpdateSchema,
  commentSchema,
} = require('../validators/ticketValidators');

const router = express.Router();

function validateUpdate(req, res, next) {
  const schema = req.user.role === 'ADMIN' ? adminUpdateSchema : userUpdateSchema;
  return validate(schema)(req, res, next);
}

router.use(authenticate);

router.post('/', authorize('USER', 'ADMIN'), validate(createTicketSchema), ticketController.createTicket);
router.get('/stats', authorize('USER', 'ADMIN'), ticketController.getStats);
router.get('/', authorize('USER', 'ADMIN'), validate(listTicketsSchema), ticketController.listTickets);
router.get('/:id', authorize('USER', 'ADMIN'), validate(ticketIdSchema), ticketController.getTicket);
router.patch('/:id', authorize('USER', 'ADMIN'), validateUpdate, ticketController.updateTicket);
router.delete('/:id', authorize('USER'), validate(ticketIdSchema), ticketController.deleteTicket);
router.post('/:id/comments', authorize('USER', 'ADMIN'), validate(commentSchema), commentController.addComment);

module.exports = router;
