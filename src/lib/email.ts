import 'server-only';
import nodemailer from 'nodemailer';

/**
 * Account e-mails (signup confirmation, password reset) are handled by
 * Supabase Auth itself - see the Supabase dashboard's Auth > Email
 * Templates / Auth > SMTP settings, not this file. This is only for the two
 * club-facing notifications Supabase Auth doesn't know about.
 */

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
  });
}

async function send(subject: string, text: string) {
  const transporter = getTransporter();
  const to = process.env.CLUB_NOTIFICATION_EMAIL;

  if (!transporter || !to) {
    console.warn('Email not configured (SMTP_HOST/CLUB_NOTIFICATION_EMAIL) - skipping:', subject);
    return;
  }

  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject: `TK77 Skalica :: ${subject}`, text });
  } catch (err) {
    console.error('Failed to send email', subject, err);
  }
}

export async function sendOrderConfirmationEmail(params: {
  bookingReference: string;
  courtName: string;
  confirmUrl: string;
  rejectUrl: string;
}) {
  await send(
    `Nová rezervácia #${params.bookingReference}`,
    `Kurt: ${params.courtName}\n\nPotvrdiť: ${params.confirmUrl}\nZamietnuť: ${params.rejectUrl}`
  );
}

export async function sendPaymentConfirmationEmail(params: { bookingReference: string; courtName: string }) {
  await send(
    `Rezervácia #${params.bookingReference} uhradená`,
    `Kurt: ${params.courtName}\nRezervácia #${params.bookingReference} bola zaplatená kreditom.`
  );
}
