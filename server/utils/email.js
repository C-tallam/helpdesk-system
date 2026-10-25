import { env } from '../config/env.js';

export const emailEnabled = () => Boolean(env.email.apiKey && env.email.from);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sends through Brevo's HTTPS API. Returns true if Brevo accepted the message.
async function sendEmail({ to, name, subject, html, text }) {
  if (!emailEnabled()) return false;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': env.email.apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: env.email.fromName, email: env.email.from },
        to: [{ email: to, name }],
        subject,
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#101828">${html}</div>`,
        textContent: text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) { console.error('Email failed:', res.status, (await res.text()).slice(0, 200)); return false; }
    return true;
  } catch (err) {
    console.error('Email error:', err.message);
    return false;
  }
}

const button = (href, label) =>
  `<p><a href="${esc(href)}" style="background:#1d4ed8;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;display:inline-block">${label}</a></p>`;

export const sendWelcomeEmail = ({ name, email }) => sendEmail({
  to: email, name, subject: 'Welcome to HelpDesk',
  html: `<h2 style="color:#0b1f4b">Welcome, ${esc(name)}!</h2><p>Your HelpDesk account is ready. You can now raise IT support tickets and follow their progress in one place.</p>${env.appUrl ? button(env.appUrl, 'Open HelpDesk') : ''}`,
  text: `Welcome, ${name}! Your HelpDesk account is ready.${env.appUrl ? ` Open it here: ${env.appUrl}` : ''}`,
});

export function sendVerificationEmail({ name, email }, token) {
  const link = `${env.appUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: email, name, subject: 'Confirm your email address',
    html: `<h2 style="color:#0b1f4b">Confirm your email, ${esc(name)}</h2><p>Click the button below to activate your HelpDesk account. The link works once and expires in 24 hours.</p>${button(link, 'Confirm my email')}<p style="color:#667085;font-size:13px">Or paste this link into your browser:<br>${esc(link)}</p><p style="color:#667085;font-size:13px">If you did not sign up, you can ignore this email.</p>`,
    text: `Hi ${name}, confirm your HelpDesk account here (valid for 24 hours): ${link}`,
  });
}
