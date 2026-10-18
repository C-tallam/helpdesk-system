// Creates (or resets) the public demo accounts and some sample tickets.
// Usage: npm run seed-demo      (safe to re-run: it resets the demo data each time)
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User, Ticket, Comment, Counter } from '../models/index.js';

const PASSWORD = process.env.DEMO_PASSWORD || 'DemoHelpdesk2026'; // must match client/src/demo.js
const ago = (days, hours = 0) => new Date(Date.now() - days * 86400000 - hours * 3600000);

const upsert = (name, email, role, passwordHash) =>
  User.findOneAndUpdate({ email }, { name, role, passwordHash, demo: true, active: true }, { upsert: true, new: true, setDefaultsOnInsert: true });

async function nextNumber() {
  const c = await Counter.findOneAndUpdate({ _id: 'ticket' }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return c.seq;
}

const samples = [
  { title: 'Cannot connect to the office Wi-Fi', category: 'Network', priority: 'High', status: 'In Progress', assigned: true, age: 2,
    description: 'My laptop shows "connected, no internet" on the staff Wi-Fi since this morning. Other colleagues on my floor are fine.',
    comments: [
      { by: 'agent', hours: 3, text: 'Thanks for reporting this. Can you forget the network and reconnect, then tell me if it works?' },
      { by: 'agent', hours: 4, internal: true, text: 'Checked the access point logs: this device has an expired lease on VLAN 20. Releasing it now.' },
      { by: 'user', hours: 6, text: 'Reconnected, but it still says no internet.' },
    ] },
  { title: 'Laptop battery drains within an hour', category: 'Hardware', priority: 'Medium', status: 'Open', assigned: false, age: 1,
    description: 'The battery used to last about five hours. Now it goes from 100% to 10% in under an hour, even when I am only using email.',
    comments: [] },
  { title: 'Need access to the shared finance folder', category: 'Account Access', priority: 'Medium', status: 'Resolved', assigned: true, age: 5,
    description: 'I have moved to the finance team and need read access to the shared finance folder.',
    comments: [
      { by: 'agent', hours: 2, text: 'Access request approved by your manager. I have added you to the finance group.' },
      { by: 'user', hours: 5, text: 'I can see the folder now, thank you!' },
    ] },
  { title: 'Printer on floor 2 is offline', category: 'Hardware', priority: 'Urgent', status: 'In Progress', assigned: true, age: 0,
    description: 'The floor 2 printer shows offline for everyone and we have documents to print for a meeting this afternoon.',
    comments: [{ by: 'agent', hours: 1, text: 'On my way to check the printer and its network cable.' }] },
  { title: 'Outlook keeps asking for my password', category: 'Software', priority: 'Low', status: 'Closed', assigned: true, age: 9,
    description: 'Outlook asks for my password every few minutes. It started after I changed my password last week.',
    comments: [
      { by: 'agent', hours: 2, text: 'This usually happens when old saved credentials remain. Please remove saved credentials for Outlook and sign in again.' },
      { by: 'user', hours: 8, text: 'That fixed it. Closing this ticket.' },
    ] },
  { title: 'Request to install design software', category: 'Software', priority: 'Low', status: 'Open', assigned: false, age: 0,
    description: 'Please could you install a vector graphics editor on my workstation? My team lead has approved the request.',
    comments: [] },
];

try {
  await connectDB();
  const hash = await bcrypt.hash(PASSWORD, 12);
  const user = await upsert('Demo Requester', 'demo.user@helpdesk.demo', 'user', hash);
  const agent = await upsert('Demo Agent', 'demo.agent@helpdesk.demo', 'agent', hash);

  const old = await Ticket.find({ createdBy: user._id }).select('_id');
  const oldIds = old.map((t) => t._id);
  await Comment.deleteMany({ ticket: { $in: oldIds } });
  await Ticket.deleteMany({ _id: { $in: oldIds } });

  for (const s of samples) {
    const created = ago(s.age, 8);
    const activity = [{ type: 'created', by: user._id, detail: 'Ticket created', at: created }];
    if (s.assigned) activity.push({ type: 'assigned', by: agent._id, detail: `Assigned to ${agent.name}`, at: new Date(created.getTime() + 3600000) });
    if (s.status !== 'Open') activity.push({ type: 'status', by: agent._id, detail: `Open → ${s.status}`, at: new Date(created.getTime() + 7200000) });
    const done = ['Resolved', 'Closed'].includes(s.status);
    const ticket = await Ticket.create({
      number: await nextNumber(), title: s.title, description: s.description, category: s.category, priority: s.priority,
      status: s.status, createdBy: user._id, assignedTo: s.assigned ? agent._id : null,
      resolvedAt: done ? new Date(created.getTime() + 7200000) : null, activity, createdAt: created, updatedAt: ago(s.age, 1),
    });
    for (const c of s.comments) {
      await Comment.create({
        ticket: ticket._id, author: c.by === 'agent' ? agent._id : user._id, text: c.text,
        internal: Boolean(c.internal), createdAt: new Date(created.getTime() + c.hours * 3600000),
      });
    }
  }
  console.log('Demo data ready.');
  console.log('  Requester: demo.user@helpdesk.demo');
  console.log('  Agent:     demo.agent@helpdesk.demo');
  console.log(`  Password:  ${PASSWORD}`);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
