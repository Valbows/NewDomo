export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const iParam = url.searchParams.get('i') ?? '0';
    const idx = Number.isFinite(Number(iParam)) ? Math.abs(Number(iParam)) : 0;

    // Same URLs used in E2E mode, but proxied to avoid cross-origin/codec quirks
    const sources = [
      'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
      'https://media.w3.org/2010/05/sintel/trailer.webm',
    ];

    const target = sources[idx % sources.length];

    const upstream = await fetch(target, { cache: 'no-store' });
    if (!upstream.ok || !upstream.body) {
      return new Response(`Upstream fetch failed: ${upstream.status} ${upstream.statusText}`, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || (target.endsWith('.webm') ? 'video/webm' : 'application/octet-stream');

    const headers = new Headers();
    headers.set('content-type', contentType);
    headers.set('cache-control', 'no-store');
    // Explicitly allow range requests if provided by upstream to improve seeking
    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) headers.set('accept-ranges', acceptRanges);

    return new Response(upstream.body, { status: 200, headers });
  } catch (err) {
    return new Response(`Proxy error: ${(err as Error).message}`, { status: 500 });
  }
}
