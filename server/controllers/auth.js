import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { wrap } from '../middleware/errorHandler.js';
import { sendWelcomeEmail } from '../utils/email.js';

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, demo: Boolean(u.demo) });

export const register = wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) return res.status(409).json({ error: 'That email is already registered' });
  // Public sign-up ALWAYS creates a normal user. Staff roles are granted separately.
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'user' });
  sendWelcomeEmail(user); // fire-and-forget: a mail problem must never break sign-up
  return res.status(201).json({ token: signToken(user), user: publicUser(user) });
});

export const login = wrap(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !ok || !user.active) return res.status(401).json({ error: 'Invalid email or password' });
  return res.json({ token: signToken(user), user: publicUser(user) });
});

export const changePassword = wrap(async (req, res) => {
  if (req.user.demo) return res.status(403).json({ error: 'Demo accounts cannot change their password' });
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.body.currentPassword, user.passwordHash))) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }
  user.passwordHash = await bcrypt.hash(req.body.newPassword, 12);
  await user.save();
  return res.json({ ok: true });
});

export const me = (req, res) => res.json(publicUser(req.user));
