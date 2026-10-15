import { Router } from 'express';
import * as t from '../controllers/tickets.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validId } from '../middleware/validate.js';
import { ticketCreateSchema, ticketUpdateSchema, commentSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);
router.param('id', validId);

router.get('/stats', requireRole('agent', 'admin'), t.stats); // must stay above '/:id'
router.post('/', validate(ticketCreateSchema), t.createTicket);
router.get('/', t.listTickets);
router.get('/:id', t.getTicket);
router.patch('/:id', validate(ticketUpdateSchema), t.updateTicket);
router.delete('/:id', requireRole('admin'), t.deleteTicket);
router.get('/:id/comments', t.listComments);
router.post('/:id/comments', validate(commentSchema), t.addComment);
export default router;
