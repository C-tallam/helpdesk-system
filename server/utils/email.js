import { env } from '../config/env.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Sends through Brevo's HTTPS API. Does nothing unless BREVO_API_KEY and EMAIL_FROM are set.
export async function sendWelcomeEmail({ name, email }) {
  const { apiKey, from, fromName } = env.email;
  if (!apiKey || !from) return;
  const link = env.appUrl;
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: fromName, email: from },
        to: [{ email, name }],
        subject: 'Welcome to HelpDesk',
        htmlContent: `<div style="font-family:Arial,sans-serif;max-width:520px;color:#101828">
          <h2 style="color:#0b1f4b">Welcome, ${esc(name)}!</h2>
          <p>Your HelpDesk account is ready. You can now raise IT support tickets and follow their progress in one place.</p>
          ${link ? `<p><a href="${esc(link)}" style="background:#1d4ed8;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open HelpDesk</a></p>` : ''}
          <p style="color:#667085;font-size:13px">If you did not create this account, you can ignore this email.</p></div>`,
        textContent: `Welcome, ${name}! Your HelpDesk account is ready.${link ? ` Open it here: ${link}` : ''}`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) console.error('Welcome email failed:', res.status, (await res.text()).slice(0, 200));
  } catch (err) {
    console.error('Welcome email error:', err.message);
  }
}
