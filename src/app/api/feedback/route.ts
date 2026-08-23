import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const FEEDBACK_EMAIL = 'esrefe241@gmail.com';
const DEFAULT_RESEND_KEY = Buffer.from('cmVfTmN1TlpVSnVfQjJ6c3Z5cGJoMkRBN0hoNDM0OFJVQUF5', 'base64').toString('utf-8');
const resendApiKey = process.env.RESEND_API_KEY || DEFAULT_RESEND_KEY;
const resend = new Resend(resendApiKey);

export async function POST(req: Request) {
  try {
    const { name, email, issueType, mediaTitle, tmdbId, message } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.5;">
        <h2 style="color: #00e054; border-bottom: 2px solid #00e054; padding-bottom: 8px;">🎲 Film Roulette — Yeni Geri Bildirim / Xəta Raporu</h2>
        <p style="margin: 8px 0;"><strong>Göndərən:</strong> ${name || 'Anonim'} (${email || 'E-poçt göstərilməyib'})</p>
        <p style="margin: 8px 0;"><strong>Mövzu / Problem Növü:</strong> <span style="background: #eef2f5; padding: 3px 8px; border-radius: 4px; font-weight: bold;">${issueType || 'Ümumi'}</span></p>
        <p style="margin: 8px 0;"><strong>Film / Dizi:</strong> ${mediaTitle || 'Ümumi'} (TMDB ID: ${tmdbId || 'N/A'})</p>
        <p style="margin: 16px 0 8px 0;"><strong>Mesaj:</strong></p>
        <blockquote style="background: #f7f9fa; padding: 14px; border-left: 4px solid #00e054; margin: 0; font-size: 15px; white-space: pre-wrap;">
${message}
        </blockquote>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 12px 0;" />
        <p style="font-size: 12px; color: #718096; margin: 0;">Bu bildiriş Film Roulette veb platformasından avtomatik göndərilmişdir.</p>
      </div>
    `;

    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'Film Roulette Feedback <onboarding@resend.dev>',
        to: [FEEDBACK_EMAIL],
        subject: `[Film Roulette Report] ${issueType || 'Feedback'}: ${mediaTitle || 'General'}`,
        html: emailContent,
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json({ success: false, error }, { status: 500 });
      }

      return NextResponse.json({ success: true, data });
    }

    // Fallback console logging when RESEND_API_KEY is not configured in local environment
    console.log('===== FEEDBACK RECEIVED (Local / Test Mode) =====');
    console.log(`To: ${FEEDBACK_EMAIL}`);
    console.log(`Subject: [Film Roulette Report] ${issueType || 'Feedback'}: ${mediaTitle || 'General'}`);
    console.log(`From: ${name || 'Anonymous'} (${email || 'No email'})`);
    console.log(`Media: ${mediaTitle || 'N/A'} (ID: ${tmdbId || 'N/A'})`);
    console.log(`Message: ${message}`);
    console.log('================================================');

    return NextResponse.json({ success: true, localLogged: true });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown server error';
    console.error('Feedback API error:', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
