// Usage: npm run set-role -- someone@example.com agent|admin|user
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { User, ROLES } from '../models/index.js';

const [email, role] = process.argv.slice(2);
try {
  if (!email || !ROLES.includes(role)) throw new Error(`Usage: npm run set-role -- email@example.com ${ROLES.join('|')}`);
  await connectDB();
  const user = await User.findOneAndUpdate({ email: email.toLowerCase() }, { role }, { new: true });
  if (!user) throw new Error(`No user found with email ${email}. Register first.`);
  console.log(`${user.email} is now: ${user.role}`);
} catch (err) {
  console.error('Failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
