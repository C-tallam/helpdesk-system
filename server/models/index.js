import mongoose from 'mongoose';

export const ROLES = ['user', 'agent', 'admin'];
export const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];
export const CATEGORIES = ['Hardware', 'Network', 'Software', 'Account Access', 'Other'];

const { Schema } = mongoose;
const options = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    },
  },
};
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, ...extra });

export const User = mongoose.model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'user' },
  active: { type: Boolean, default: true },
  demo: { type: Boolean, default: false },
}, options));

export const Counter = mongoose.model('Counter', new Schema({
  _id: String,
  seq: { type: Number, default: 0 },
}));

const activitySchema = new Schema({
  type: { type: String, required: true },
  by: ref('User'),
  detail: { type: String, default: '' },
  at: { type: Date, default: Date.now },
}, { _id: false, toJSON: { virtuals: false } });

const ticketSchema = new Schema({
  number: { type: Number, required: true, unique: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, enum: CATEGORIES, default: 'Other' },
  priority: { type: String, enum: PRIORITIES, default: 'Medium' },
  status: { type: String, enum: STATUSES, default: 'Open', index: true },
  createdBy: ref('User', { required: true, index: true }),
  assignedTo: ref('User', { default: null }),
  resolvedAt: { type: Date, default: null },
  activity: [activitySchema],
}, options);
ticketSchema.virtual('key').get(function key() { return `TKT-${String(this.number).padStart(4, '0')}`; });
export const Ticket = mongoose.model('Ticket', ticketSchema);

export const Comment = mongoose.model('Comment', new Schema({
  ticket: ref('Ticket', { required: true, index: true }),
  author: ref('User', { required: true }),
  text: { type: String, required: true, trim: true },
  internal: { type: Boolean, default: false },
}, options));
