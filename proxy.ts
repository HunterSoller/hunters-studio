import { NextResponse, type NextRequest } from "next/server";

// Temporarily takes the site offline on the public domain. Delete this file to bring it back.
const OFFLINE_HOSTS = new Set(["huntersstudio.com", "www.huntersstudio.com"]);

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Hunter’s Studio</title>
<style>
  html,body{height:100%;margin:0;background:#060608;color:rgba(255,255,255,.8)}
  body{display:grid;place-items:center;font:400 12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase}
</style>
</head>
<body>Hunter’s Studio — temporarily unavailable</body>
</html>`;

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  if (!OFFLINE_HOSTS.has(host)) return NextResponse.next();

  // Keep cancellation links from existing confirmation emails working.
  if (request.nextUrl.pathname.startsWith("/api/booking/cancel")) return NextResponse.next();

  return new NextResponse(OFFLINE_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "retry-after": "86400",
      "cache-control": "no-store",
    },
  });
}
