const SCRIPT_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || "";

export async function GET(request: Request) {
  if (!SCRIPT_URL) {
    return new Response("Booking script URL not configured.", {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return new Response("Missing eventId.", {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", eventId }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data?.success) {
      const msg =
        typeof data?.error === "string"
          ? data.error
          : `Could not cancel this booking (status ${res.status}).`;
      return new Response(msg, {
        status: 500,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    return new Response(
      "<html><body style=\"background:#050509;color:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;\"><div><h1 style=\"font-size:1.5rem;margin-bottom:0.5rem;\">Session cancelled</h1><p style=\"margin:0.5rem 0;\">Your booking has been cancelled and the time has been reopened.</p></div></body></html>",
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  } catch {
    return new Response("Could not reach booking calendar to cancel.", {
      status: 502,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

