import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { timestamp, source, user_agent } = body

    // Send notification email to hello@raresift.com
    // This is a simple implementation - in production you'd use a proper email service
    const emailData = {
      to: 'hello@raresift.com',
      subject: 'New Demo Request - RareSift',
      html: `
        <h2>New Demo Request</h2>
        <p><strong>Source:</strong> ${source}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <p><strong>User Agent:</strong> ${user_agent}</p>
        <hr>
        <p>A user has requested a demo from the ${source} section of the website.</p>
        <p>Please follow up with them promptly.</p>
      `,
    }

    // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll just log it and return success
    console.log('Demo notification email would be sent:', emailData)

    return NextResponse.json({ success: true, message: 'Demo notification sent' })
  } catch (error) {
    console.error('Failed to send demo notification:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to send notification' },
      { status: 500 }
    )
  }
}