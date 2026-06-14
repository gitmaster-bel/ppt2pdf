import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  // Origin validation to prevent open proxy abuse
  const referer = request.headers.get('referer') || request.headers.get('origin');
  const host = request.headers.get('host') || new URL(request.url).host;
  
  if (!referer || !referer.includes(host)) {
    return new NextResponse('Unauthorized proxy request', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const targetOrigin = new URL(targetUrl).origin;
    
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': targetOrigin,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      }
    });

    if (!response.ok) {
      return new NextResponse(`Proxy error: Upstream returned ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/html')) {
        const html = await response.text();
        
        // Inject <base> tag so relative paths (like /js/app.js) still resolve to the original domain
        // Also inject a script to spoof window.location if the player tries to do iframe bursting
        const modifiedHtml = html.replace(
            /<head>/i, 
            `<head>
            <base href="${targetOrigin}/">
            <script>
                // Spoof location to trick anti-iframe scripts
                Object.defineProperty(document, 'domain', {
                    value: '${new URL(targetOrigin).hostname}',
                    writable: false
                });
            </script>`
        );

        return new NextResponse(modifiedHtml, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                // We deliberately DO NOT return X-Frame-Options or Content-Security-Policy
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    }

    // If it's not HTML, just pass it through blindly
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
        headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
        }
    });

  } catch (error: any) {
    console.error('Iframe Proxy Error:', error);
    return new NextResponse(`Proxy fetch failed: ${error.message}`, { status: 500 });
  }
}
