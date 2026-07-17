import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function extractInstagramId(url: string): string | null {
  const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  return match?.[1] ?? null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  const postId = extractInstagramId(url);
  if (!postId) {
    return NextResponse.json({ error: '유효한 Instagram URL이 아닙니다. /p/, /reel/, /tv/ 형식이어야 합니다.' }, { status: 400 });
  }

  try {
    // Fetch the public Instagram page and extract og:description
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Instagram 페이지를 불러올 수 없습니다 (${res.status}). 비공개 계정이거나 로그인이 필요한 게시물일 수 있습니다.` },
        { status: 502 },
      );
    }

    const html = await res.text();

    // Extract og:description (Instagram puts caption text there for public posts)
    const ogDescMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i)
      ?? html.match(/<meta\s+content="([^"]+)"\s+property="og:description"/i);

    let captionText = ogDescMatch?.[1] ?? '';

    // Decode HTML entities
    captionText = captionText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#x27;/g, "'");

    // Extract og:title for the post title
    const ogTitleMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i)
      ?? html.match(/<meta\s+content="([^"]+)"\s+property="og:title"/i);
    const title = ogTitleMatch?.[1]?.replace(/&amp;/g, '&') ?? '';

    if (!captionText) {
      return NextResponse.json(
        {
          error: '캡션을 추출할 수 없습니다. Instagram이 로그인을 요구하거나 비공개 게시물일 수 있습니다.',
          postId,
          title,
          transcript: '',
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ postId, title, transcript: captionText, url });
  } catch (err) {
    if (err instanceof Error && err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Instagram 페이지 로딩 시간 초과. 나중에 다시 시도해주세요.' }, { status: 504 });
    }
    const msg = err instanceof Error ? err.message : '캡션 추출에 실패했습니다.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
