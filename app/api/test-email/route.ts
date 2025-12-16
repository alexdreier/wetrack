import { NextResponse } from 'next/server'
import { sendEmail, taskAssignedEmail } from '@/lib/email'

export async function GET() {
  const email = taskAssignedEmail(
    'Review Q4 budget proposal and provide feedback',
    'Sarah Johnson',
    'http://localhost:3000/dashboard/tasks/abc123'
  )

  await sendEmail({
    to: 'adreier@wested.org',
    ...email,
  })

  return NextResponse.json({ success: true, message: 'Test email sent to adreier@wested.org' })
}
