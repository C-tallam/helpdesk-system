import { Router } from 'express';
import { register, login, me } from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/schemas.js';

const router = Router();
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, me);
export default router;
