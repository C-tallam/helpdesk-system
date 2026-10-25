import { z } from 'zod';
import { STATUSES, PRIORITIES, CATEGORIES, ROLES } from '../models/index.js';

const text = (max, min = 0) => z.string().trim().min(min).max(max);
const email = z.string().trim().toLowerCase().email().max(254);
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const registerSchema = z.object({
  name: text(80, 2),
  email,
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password must be at most 72 characters'),
});
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(72, 'New password must be at most 72 characters'),
}).refine((o) => o.currentPassword !== o.newPassword, { message: 'New password must be different', path: ['newPassword'] });
export const verifyEmailSchema = z.object({ token: z.string().regex(/^[a-f\d]{64}$/i, 'Invalid token') });
export const resendSchema = z.object({ email });
export const loginSchema = z.object({ email, password: z.string().min(1).max(200) });

export const ticketCreateSchema = z.object({
  title: text(150, 5),
  description: text(5000, 10),
  category: z.enum(CATEGORIES).default('Other'),
  priority: z.enum(PRIORITIES).default('Medium'),
});
export const ticketUpdateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
  assignedTo: objectId.nullable().optional(),
}).refine((o) => Object.keys(o).length > 0, 'Nothing to update');

export const listQuerySchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
  assigned: z.enum(['me', 'unassigned']).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export const commentSchema = z.object({ text: text(2000, 1), internal: z.boolean().default(false) });
export const roleSchema = z.object({ role: z.enum(ROLES) });
