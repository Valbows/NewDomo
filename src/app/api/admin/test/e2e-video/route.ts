export const dynamic = 'force-dynamic';

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

    // Forward Range requests for proper media loading behavior (metadata/seeking)
    const range = request.headers.get('range') || undefined;
    const upstream = await fetch(target, {
      cache: 'no-store',
      headers: range ? { Range: range } : undefined,
    });
    if (!upstream.ok || !upstream.body) {
      return new Response(`Upstream fetch failed: ${upstream.status} ${upstream.statusText}`, { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') || (target.endsWith('.webm') ? 'video/webm' : 'application/octet-stream');

    const headers = new Headers();
    headers.set('content-type', contentType);
    headers.set('cache-control', 'no-store');
    // Propagate useful headers for media elements
    const acceptRanges = upstream.headers.get('accept-ranges');
    if (acceptRanges) headers.set('accept-ranges', acceptRanges);
    const contentLength = upstream.headers.get('content-length');
    if (contentLength) headers.set('content-length', contentLength);
    const contentRange = upstream.headers.get('content-range');
    if (contentRange) headers.set('content-range', contentRange);
    const etag = upstream.headers.get('etag');
    if (etag) headers.set('etag', etag);
    const lastModified = upstream.headers.get('last-modified');
    if (lastModified) headers.set('last-modified', lastModified);
    headers.set('vary', 'range');

    // Preserve upstream status (200 or 206 for partial content)
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch (err) {
    return new Response(`Proxy error: ${(err as Error).message}`, { status: 500 });
  }
}