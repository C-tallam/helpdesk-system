import { Router } from 'express';
import { listAgents, listUsers, setRole } from '../controllers/users.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate, validId } from '../middleware/validate.js';
import { roleSchema } from '../validators/schemas.js';

const router = Router();
router.use(requireAuth);
router.param('id', validId);

router.get('/agents', requireRole('agent', 'admin'), listAgents);
router.get('/', requireRole('admin'), listUsers);
router.patch('/:id/role', requireRole('admin'), validate(roleSchema), setRole);
export default router;
