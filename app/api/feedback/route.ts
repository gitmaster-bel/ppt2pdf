import { NextResponse } from 'next/server';

// ─── Private Feedback Relay ───────────────────────────────────────────────────
// Forwards messages and images directly to Discord Webhook via FormData.
// 100% Anonymous. No databases. No logs.

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const type = formData.get('type') as string;
    const message = formData.get('message') as string;
    const image = formData.get('image') as File | null;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK;
    if (!webhookUrl) {
      // Silently accept if webhook is missing to avoid exposing config to clients
      return NextResponse.json({ ok: true });
    }

    const typeEmoji = type === 'bug' ? '🐛' : type === 'feature' ? '💡' : '📬';
    const typeLabel = type === 'bug' ? 'Bug Report' : type === 'feature' ? 'Feature Idea' : 'General Feedback';
    const typeColor = type === 'bug' ? 0xef4444 : type === 'feature' ? 0xf59e0b : 0x8b5cf6;

    // Build Discord FormData payload
    const discordPayload = new FormData();
    
    discordPayload.append('payload_json', JSON.stringify({
      embeds: [{
        title: `${typeEmoji} ${typeLabel} — ZIVOX`,
        description: message,
        color: typeColor,
        timestamp: new Date().toISOString(),
        footer: { text: 'ZIVOX Feedback · Anonymous · Server Relay' },
        // Tell discord to use the attached file as the embed image
        image: image ? { url: 'attachment://upload.jpg' } : undefined,
      }],
    }));

    if (image) {
      discordPayload.append('file[0]', image, 'upload.jpg');
    }

    await fetch(webhookUrl, {
      method: 'POST',
      body: discordPayload,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Feedback Error:', error);
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}
