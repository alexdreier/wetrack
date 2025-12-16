import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log('Email not configured, skipping:', { to, subject })
    return
  }

  try {
    await transporter.sendMail({
      from: `"WETrack" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

export function taskAssignedEmail(taskTitle: string, assignedBy: string, taskUrl: string) {
  return {
    subject: `[WETrack] Task assigned to you: ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Task Assigned</h2>
        <p>${assignedBy} assigned you a task:</p>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${taskTitle}</strong>
        </div>
        <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Task
        </a>
        <p style="color: #666; margin-top: 24px; font-size: 14px;">
          You received this email because you have notifications enabled in WETrack.
        </p>
      </div>
    `,
  }
}

export function newCommentEmail(taskTitle: string, commenter: string, comment: string, taskUrl: string) {
  return {
    subject: `[WETrack] New comment on: ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">New Comment</h2>
        <p>${commenter} commented on <strong>${taskTitle}</strong>:</p>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
          ${comment}
        </div>
        <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Task
        </a>
        <p style="color: #666; margin-top: 24px; font-size: 14px;">
          You received this email because you have notifications enabled in WETrack.
        </p>
      </div>
    `,
  }
}

export function statusChangedEmail(taskTitle: string, changedBy: string, newStatus: string, taskUrl: string) {
  const statusLabels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
  }

  return {
    subject: `[WETrack] Task status updated: ${taskTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a1a1a;">Status Updated</h2>
        <p>${changedBy} changed the status of <strong>${taskTitle}</strong> to:</p>
        <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <strong>${statusLabels[newStatus] || newStatus}</strong>
        </div>
        <a href="${taskUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          View Task
        </a>
        <p style="color: #666; margin-top: 24px; font-size: 14px;">
          You received this email because you have notifications enabled in WETrack.
        </p>
      </div>
    `,
  }
}
