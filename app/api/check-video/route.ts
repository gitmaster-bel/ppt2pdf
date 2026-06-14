import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ playable: false, error: 'Missing id' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 seconds timeout

    const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
      next: { revalidate: 86400 } // Cache results for 24 hours to ensure extreme speed and efficiency
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      // If YouTube returns a non-2xx status, fail safe and mark as unplayable to avoid broken players
      return NextResponse.json({ playable: false, reason: `HTTP error: ${res.status}` });
    }

    const html = await res.text();

    // Hacker playability check: extract and inspect playabilityStatus inside initial HTML
    const playStatusMatch = html.match(/"playabilityStatus"\s*:\s*\{([^}]+)\}/);
    if (playStatusMatch) {
      const statusContent = playStatusMatch[1];
      const isOK = statusContent.includes('"status":"OK"');
      const isPlayableInEmbed = statusContent.includes('"playableInEmbed":true');

      if (isOK && isPlayableInEmbed) {
        return NextResponse.json({ playable: true });
      }
    }

    // Direct string match fallbacks for guaranteed accuracy
    if (
      html.includes('"status":"LOGIN_REQUIRED"') ||
      html.includes('"status":"ERROR"') ||
      html.includes('"status":"UNPLAYABLE"') ||
      html.includes('reason":"This video is age-restricted') ||
      html.includes('Sign in to confirm your age') ||
      html.includes('inappropriate for some users')
    ) {
      return NextResponse.json({ playable: false, reason: 'restricted' });
    }

    // If we could find "playableInEmbed":true anywhere, it's highly likely playable
    const hasPlayableEmbed = html.includes('"playableInEmbed":true');
    return NextResponse.json({ playable: hasPlayableEmbed });

  } catch (error: any) {
    console.error(`Error verifying YouTube playability for ID ${id}:`, error);
    // If request was aborted due to timeout, fail safe to prevent blocking the UI
    return NextResponse.json({ 
      playable: false, 
      error: error.name === 'AbortError' ? 'Timeout' : 'Fetch failed' 
    });
  }
}
