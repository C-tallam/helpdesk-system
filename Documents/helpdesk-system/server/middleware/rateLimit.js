import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, error) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { error } });

export const apiLimiter = make(15 * 60 * 1000, 600, 'Too many requests, please try again later.');
export const loginLimiter = make(15 * 60 * 1000, 10, 'Too many login attempts. Please try again later.');
export const registerLimiter = make(60 * 60 * 1000, 10, 'Too many sign-ups from this address. Please try again later.');
