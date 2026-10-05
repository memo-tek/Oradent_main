import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (env.SMTP_HOST && env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      // Dev mode: log emails instead of sending
      transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }
  return transporter;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const transport = getTransporter();

  try {
    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });

    if (env.NODE_ENV === 'development' && !env.SMTP_HOST) {
      logger.debug({ to, subject, messageId: info.messageId }, 'Email logged (dev mode)');
    } else {
      logger.info({ to, subject, messageId: info.messageId }, 'Email sent');
    }
  } catch (error) {
    logger.error(error, 'Failed to send email');
    throw error;
  }
}

export function generateAppointmentConfirmationEmail(
  patientName: string,
  date: string,
  time: string,
  provider: string,
  practiceName: string,
  practicePhone: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'DM Sans', Arial, sans-serif; background-color: #fafaf9; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e7e5e4;">
        <h1 style="color: #0d9488; font-size: 24px; margin: 0 0 8px;">Appointment Confirmed</h1>
        <p style="color: #57534e; font-size: 14px; margin: 0 0 24px;">${practiceName}</p>

        <p style="color: #1c1917; font-size: 16px;">Hi ${patientName},</p>
        <p style="color: #57534e;">Your dental appointment has been confirmed:</p>

        <div style="background: #f5f5f4; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <p style="margin: 4px 0; color: #1c1917;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 4px 0; color: #1c1917;"><strong>Time:</strong> ${time}</p>
          <p style="margin: 4px 0; color: #1c1917;"><strong>Provider:</strong> ${provider}</p>
        </div>

        <p style="color: #57534e; font-size: 14px;">
          If you need to reschedule, please call us at ${practicePhone}.
        </p>

        <p style="color: #a8a29e; font-size: 12px; margin-top: 32px; text-align: center;">
          ${practiceName} | ${practicePhone}
        </p>
      </div>
    </body>
    </html>
  `;
}

export function generateAppointmentReminderEmail(
  patientName: string,
  date: string,
  time: string,
  provider: string,
  practiceName: string,
  practicePhone: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: 'DM Sans', Arial, sans-serif; background-color: #fafaf9; padding: 40px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; border: 1px solid #e7e5e4;">
        <h1 style="color: #0d9488; font-size: 24px; margin: 0 0 8px;">Appointment Reminder</h1>
        <p style="color: #57534e; font-size: 14px; margin: 0 0 24px;">${practiceName}</p>

        <p style="color: #1c1917; font-size: 16px;">Hi ${patientName},</p>
        <p style="color: #57534e;">This is a friendly reminder about your upcoming dental appointment:</p>

        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #bbf7d0;">
          <p style="margin: 4px 0; color: #1c1917;"><strong>Date:</strong> ${date}</p>
          <p style="margin: 4px 0; color: #1c1917;"><strong>Time:</strong> ${time}</p>
          <p style="margin: 4px 0; color: #1c1917;"><strong>Provider:</strong> ${provider}</p>
        </div>

        <p style="color: #57534e; font-size: 14px;">
          Please arrive 10 minutes early. If you need to cancel or reschedule, call us at ${practicePhone}.
        </p>
      </div>
    </body>
    </html>
  `;
}
