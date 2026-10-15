import { User } from '../models/index.js';
import { wrap } from '../middleware/errorHandler.js';

export const listAgents = wrap(async (_req, res) =>
  res.json(await User.find({ role: { $in: ['agent', 'admin'] }, active: true }).select('name email role').sort({ name: 1 })));

export const listUsers = wrap(async (_req, res) =>
  res.json(await User.find().select('name email role active createdAt').sort({ createdAt: -1 }).limit(500)));

export const setRole = wrap(async (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot change your own role' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  return user ? res.json(user) : res.status(404).json({ error: 'User not found' });
});
