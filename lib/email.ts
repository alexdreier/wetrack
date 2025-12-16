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
      from: `"WE Tracker" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log('Email sent to:', to)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

function emailWrapper(content: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background-color: #00467F; padding: 32px 40px; border-radius: 12px 12px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <img src="https://wested2024.s3.us-west-1.amazonaws.com/wp-content/uploads/2024/06/11163339/wested-logo.svg" alt="WestEd" height="28" style="filter: brightness(0) invert(1);">
                  </td>
                  <td align="right">
                    <span style="color: #ffffff; font-size: 18px; font-weight: 600;">WE Tracker</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                You received this email because you have notifications enabled in WE Tracker.
              </p>
              <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 13px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #1669C9; text-decoration: none;">Manage notification settings</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function actionButton(text: string, url: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin-top: 24px;">
      <tr>
        <td style="background-color: #00467F; border-radius: 8px;">
          <a href="${url}" style="display: inline-block; padding: 14px 28px; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px;">
            ${text} →
          </a>
        </td>
      </tr>
    </table>
  `
}

export function taskAssignedEmail(taskTitle: string, assignedBy: string, taskUrl: string) {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">
      New Task Assigned
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px;">
      ${assignedBy} assigned you a task
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color: #f8fafc; border-left: 4px solid #00467F; padding: 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #1a1a1a; font-size: 17px; font-weight: 600;">
            ${taskTitle}
          </p>
        </td>
      </tr>
    </table>

    ${actionButton('View Task', taskUrl)}
  `

  return {
    subject: `[WE Tracker] ${assignedBy} assigned you: ${taskTitle}`,
    html: emailWrapper(content),
  }
}

export function newCommentEmail(taskTitle: string, commenter: string, comment: string, taskUrl: string) {
  const content = `
    <h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">
      New Comment
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px;">
      ${commenter} commented on <strong style="color: #1a1a1a;">${taskTitle}</strong>
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color: #f8fafc; border-left: 4px solid #1669C9; padding: 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.6;">
            "${comment}"
          </p>
        </td>
      </tr>
    </table>

    ${actionButton('View & Reply', taskUrl)}
  `

  return {
    subject: `[WE Tracker] ${commenter} commented on: ${taskTitle}`,
    html: emailWrapper(content),
  }
}

export function statusChangedEmail(taskTitle: string, changedBy: string, newStatus: string, taskUrl: string) {
  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    not_started: { label: 'Not Started', color: '#6b7280', bg: '#f3f4f6' },
    in_progress: { label: 'In Progress', color: '#1669C9', bg: '#dbeafe' },
    completed: { label: 'Completed', color: '#16a34a', bg: '#dcfce7' },
  }

  const status = statusConfig[newStatus] || statusConfig.not_started

  const content = `
    <h1 style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 24px; font-weight: 700;">
      Task Status Updated
    </h1>
    <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px;">
      ${changedBy} updated the status of <strong style="color: #1a1a1a;">${taskTitle}</strong>
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="background-color: #f8fafc; padding: 20px; border-radius: 8px; text-align: center;">
          <span style="display: inline-block; background-color: ${status.bg}; color: ${status.color}; padding: 10px 20px; border-radius: 50px; font-weight: 600; font-size: 15px;">
            ${status.label}
          </span>
        </td>
      </tr>
    </table>

    ${actionButton('View Task', taskUrl)}
  `

  return {
    subject: `[WE Tracker] ${taskTitle} marked as ${status.label}`,
    html: emailWrapper(content),
  }
}
