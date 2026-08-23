import { NextResponse } from 'next/server';

const FEEDBACK_EMAIL = 'alinovruz29@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, issueType, mediaTitle, message } = body as {
      name?: string;
      issueType: string;
      mediaTitle?: string;
      message: string;
    };

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const subject = `[Film Roulette Feedback] ${issueType}: ${mediaTitle || 'General'}`;
    const emailBody = [
      `Issue Type: ${issueType}`,
      `Media: ${mediaTitle || 'N/A'}`,
      `From: ${name || 'Anonymous'}`,
      `User-Agent: ${request.headers.get('user-agent') || 'Unknown'}`,
      '',
      'Message:',
      message,
    ].join('\n');

    // Try Resend API first (if RESEND_API_KEY is set)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: 'Film Roulette <onboarding@resend.dev>',
          to: [FEEDBACK_EMAIL],
          subject,
          text: emailBody,
        }),
      });

      if (res.ok) {
        return NextResponse.json({ success: true });
      }
      console.error('Resend API error:', res.status, await res.text());
    }

    // Fallback: Log to console (for environments without email service)
    console.log('===== FEEDBACK RECEIVED =====');
    console.log(`To: ${FEEDBACK_EMAIL}`);
    console.log(`Subject: ${subject}`);
    console.log(emailBody);
    console.log('=============================');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
