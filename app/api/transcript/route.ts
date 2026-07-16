import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export const runtime = 'nodejs';

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: '유효한 YouTube URL이 아닙니다.' }, { status: 400 });
  }

  try {
    // Try Korean first, then English, then auto-generated
    let transcript: Awaited<ReturnType<typeof YoutubeTranscript.fetchTranscript>> = [];
    const langs = ['ko', 'en', 'a.ko', 'a.en'];

    for (const lang of langs) {
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang });
        if (transcript.length > 0) break;
      } catch {
        // try next lang
      }
    }

    if (transcript.length === 0) {
      // Try without specifying language
      try {
        transcript = await YoutubeTranscript.fetchTranscript(videoId);
      } catch {
        return NextResponse.json(
          { error: '이 영상에는 자막이 없거나 자막을 불러올 수 없습니다.' },
          { status: 404 },
        );
      }
    }

    const text = transcript.map((t) => t.text).join(' ');

    // Fetch video title via oEmbed (free, no API key)
    let title = '';
    try {
      const oembed = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      );
      if (oembed.ok) {
        const data = await oembed.json();
        title = data.title ?? '';
      }
    } catch {
      // title is optional
    }

    return NextResponse.json({ videoId, title, transcript: text });
  } catch (err) {
    const msg = err instanceof Error ? err.message : '자막 추출에 실패했습니다.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
