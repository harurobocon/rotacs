import { NextRequest, NextResponse } from "next/server";

const AI_CRAWLER_UA_PATTERNS: ReadonlyArray<RegExp> = [
  /gptbot/i,
  /oai-searchbot/i,
  /chatgpt-user/i,
  /ccbot/i,
  /anthropic-ai/i,
  /claudebot/i,
  /claude-web/i,
  /perplexitybot/i,
  /perplexity-user/i,
  /google-extended/i,
  /applebot-extended/i,
  /cohere-ai/i,
  /meta-externalagent/i,
  /meta-externalfetcher/i,
  /bytespider/i,
  /bytedancespider/i,
  /diffbot/i,
  /petalbot/i,
  /youbot/i,
  /amazonbot/i,
];

function isAiCrawler(userAgent: string): boolean {
  return AI_CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";

  if (userAgent && isAiCrawler(userAgent)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet, noimageindex, nocache",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};
