import { Ticket, Comment, User, Counter, STATUSES, PRIORITIES, CATEGORIES } from '../models/index.js';
import { wrap } from '../middleware/errorHandler.js';
import { listQuerySchema } from '../validators/schemas.js';

const isStaff = (u) => u.role !== 'user';
const POP = [{ path: 'createdBy', select: 'name email' }, { path: 'assignedTo', select: 'name email' }];
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function nextNumber() {
  const c = await Counter.findOneAndUpdate({ _id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}

// Users can only reach their own tickets. Others get 404 (don't reveal that a ticket exists).
async function findAccessible(req, res) {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket || (!isStaff(req.user) && !ticket.createdBy.equals(req.user._id))) {
    res.status(404).json({ error: 'Ticket not found' });
    return null;
  }
  return ticket;
}

export const createTicket = wrap(async (req, res) => {
  const number = await nextNumber();
  const ticket = await Ticket.create({
    ...req.body,
    number,
    createdBy: req.user._id,
    activity: [{ type: 'created', by: req.user._id, detail: 'Ticket created' }],
  });
  await ticket.populate(POP);
  res.status(201).json(ticket);
});

export const listTickets = wrap(async (req, res) => {
  const q = listQuerySchema.parse(req.query);
  const filter = {};
  if (!isStaff(req.user)) filter.createdBy = req.user._id;
  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.category) filter.category = q.category;
  if (q.assigned === 'me') filter.assignedTo = req.user._id;
  if (q.assigned === 'unassigned') filter.assignedTo = null;
  if (q.q) filter.title = { $regex: escapeRegex(q.q), $options: 'i' };

  const [items, total] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate(POP),
    Ticket.countDocuments(filter),
  ]);
  res.json({ items, page: q.page, limit: q.limit, total, pages: Math.ceil(total / q.limit) });
});

export const getTicket = wrap(async (req, res) => {
  const ticket = await findAccessible(req, res);
  if (!ticket) return;
  await ticket.populate([...POP, { path: 'activity.by', select: 'name role' }]);
  res.json(ticket);
});

export const updateTicket = wrap(async (req, res) => {
  const ticket = await findAccessible(req, res);
  if (!ticket) return;
  const body = req.body;

  if (!isStaff(req.user) && !(Object.keys(body).length === 1 && body.status === 'Closed')) {
    return res.status(403).json({ error: 'You can only close your own ticket' });
  }

  let assignee = null;
  if (body.assignedTo) {
    assignee = await User.findOne({ _id: body.assignedTo, role: { $in: ['agent', 'admin'] }, active: true });
    if (!assignee) return res.status(400).json({ error: 'Assignee must be an active agent or admin' });
  }

  for (const field of ['status', 'priority', 'category']) {
    if (body[field] && body[field] !== ticket[field]) {
      ticket.activity.push({ type: field, by: req.user._id, detail: `${ticket[field]} → ${body[field]}` });
      ticket[field] = body[field];
    }
  }
  if ('assignedTo' in body) {
    const current = ticket.assignedTo ? ticket.assignedTo.toString() : null;
    const next = body.assignedTo || null;
    if (current !== next) {
      ticket.activity.push({ type: 'assigned', by: req.user._id, detail: assignee ? `Assigned to ${assignee.name}` : 'Unassigned' });
      ticket.assignedTo = next;
    }
  }
  ticket.resolvedAt = ['Resolved', 'Closed'].includes(ticket.status) ? ticket.resolvedAt || new Date() : null;

  await ticket.save();
  await ticket.populate([...POP, { path: 'activity.by', select: 'name role' }]);
  res.json(ticket);
});

export const deleteTicket = wrap(async (req, res) => {
  const ticket = await Ticket.findByIdAndDelete(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  await Comment.deleteMany({ ticket: ticket._id });
  return res.status(204).end();
});

export const listComments = wrap(async (req, res) => {
  const ticket = await findAccessible(req, res);
  if (!ticket) return;
  const filter = { ticket: ticket._id };
  if (!isStaff(req.user)) filter.internal = false;
  res.json(await Comment.find(filter).sort({ createdAt: 1 }).populate('author', 'name role'));
});

export const addComment = wrap(async (req, res) => {
  const ticket = await findAccessible(req, res);
  if (!ticket) return;
  if (ticket.status === 'Closed' && !isStaff(req.user)) {
    return res.status(409).json({ error: 'This ticket is closed' });
  }
  const comment = await Comment.create({
    ticket: ticket._id,
    author: req.user._id,
    text: req.body.text,
    internal: isStaff(req.user) ? req.body.internal : false, // users can never post internal notes
  });
  await Ticket.findByIdAndUpdate(ticket._id, { $currentDate: { updatedAt: true } });
  await comment.populate('author', 'name role');
  res.status(201).json(comment);
});

const group = (field) => Ticket.aggregate([{ $group: { _id: `$${field}`, count: { $sum: 1 } } }]);
const fill = (keys, rows) => Object.fromEntries(keys.map((k) => [k, rows.find((r) => r._id === k)?.count || 0]));
const ACTIVE = { $in: ['Open', 'In Progress'] };

export const stats = wrap(async (req, res) => {
  const [total, byStatus, byPriority, byCategory, unassigned, assignedToMe] = await Promise.all([
    Ticket.countDocuments(),
    group('status'), group('priority'), group('category'),
    Ticket.countDocuments({ assignedTo: null, status: ACTIVE }),
    Ticket.countDocuments({ assignedTo: req.user._id, status: ACTIVE }),
  ]);
  res.json({
    total,
    byStatus: fill(STATUSES, byStatus),
    byPriority: fill(PRIORITIES, byPriority),
    byCategory: fill(CATEGORIES, byCategory),
    unassigned,
    assignedToMe,
  });
});
