import { Router } from 'express';
import { register, login, me, changePassword } from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/schemas.js';

const router = Router();
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, loginLimiter, validate(changePasswordSchema), changePassword);
export default router;
