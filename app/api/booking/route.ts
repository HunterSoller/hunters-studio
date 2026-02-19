const SCRIPT_URL = process.env.NEXT_PUBLIC_BOOKING_API_URL || "";
const MAIL_HOST = process.env.MAIL_HOST || "";
const MAIL_PORT = parseInt(process.env.MAIL_PORT || "587", 10);
const MAIL_SECURE = process.env.MAIL_SECURE === "true";
const MAIL_USER = process.env.MAIL_USER || "";
const MAIL_PASS = process.env.MAIL_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || "";

const STUDIO_ADDRESS = "100 Alamosa Way Unit 402";

/** Format 24h "HH:00" as 12h (e.g. "14:00" -> "2:00 PM"). */
function formatTime12h(time: string): string {
  const m = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return time;
  let h = parseInt(m[1], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m[2]} ${ampm}`;
}

/** Compute duration in hours from start/end "HH:00" strings (e.g. "10:00" and "14:00" -> 4). */
function durationHours(startTime: string, endTime: string): number | null {
  const s = startTime.match(/^(\d{1,2}):(\d{2})$/);
  const e = endTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!s || !e) return null;
  const startM = parseInt(s[1], 10) * 60 + parseInt(s[2], 10);
  const endM = parseInt(e[1], 10) * 60 + parseInt(e[2], 10);
  if (endM <= startM) return null;
  return (endM - startM) / 60;
}

export async function GET(request: Request) {
  if (!SCRIPT_URL) {
    return Response.json(
      { error: "Booking script URL not configured" },
      { status: 503 }
    );
  }
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");
  if (!month) {
    return Response.json(
      { error: "Missing month param. Use ?month=YYYY-MM" },
      { status: 400 }
    );
  }
  try {
    const url = new URL(SCRIPT_URL);
    url.searchParams.set("month", month);
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json(
      { error: "Could not reach booking calendar" },
      { status: 502 }
    );
  }
}

export async function POST(request: Request) {
  if (!SCRIPT_URL) {
    return Response.json(
      { error: "Booking script URL not configured" },
      { status: 503 }
    );
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    const status = res.status;

    // Send email confirmation if booking succeeded and mail is configured
    if (status === 200 && data?.success && typeof body === "object" && body !== null) {
      const email = "email" in body && typeof body.email === "string" ? body.email : "";
      const firstName = "firstName" in body && typeof body.firstName === "string" ? body.firstName : "";
      const date = "date" in body && typeof body.date === "string" ? body.date : "";
      const startTime = "startTime" in body && typeof body.startTime === "string" ? body.startTime : "";
      const endTime = "endTime" in body && typeof body.endTime === "string" ? body.endTime : "";
      const quote = "quote" in body && (typeof body.quote === "number" || typeof body.quote === "string") ? body.quote : null;
      const hoursNum = startTime && endTime ? durationHours(startTime, endTime) : null;
      const hoursLabel = hoursNum != null ? `${hoursNum} hour${hoursNum === 1 ? "" : "s"}` : "";
      if (
        MAIL_HOST &&
        MAIL_USER &&
        MAIL_PASS &&
        MAIL_FROM &&
        email
      ) {
        const timeRange = `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
        const durationLine = hoursLabel ? `Duration: ${hoursLabel}\n` : "";
        const totalLine = quote != null ? `Total: $${quote}\n` : "";
        const text = `Hi${firstName ? ` ${firstName}` : ""},\n\nYour booking at The Studio is confirmed.\n\nDate: ${date}\nTime: ${timeRange}\n${durationLine}${totalLine}Address: ${STUDIO_ADDRESS}\n\nSee you soon!`;
        const html = `<p>Hi${firstName ? ` ${firstName}` : ""},</p><p>Your booking at The Studio is confirmed.</p><ul><li>Date: ${date}</li><li>Time: ${timeRange}</li>${hoursLabel ? `<li>Duration: ${hoursLabel}</li>` : ""}${quote != null ? `<li>Total: $${quote}</li>` : ""}<li>Address: ${STUDIO_ADDRESS}</li></ul><p>See you soon!</p>`;
        try {
          const nodemailer = await import("nodemailer");
          const transporter = nodemailer.default.createTransport({
            host: MAIL_HOST,
            port: MAIL_PORT,
            secure: MAIL_SECURE,
            auth: { user: MAIL_USER, pass: MAIL_PASS },
          });
          await transporter.sendMail({
            from: MAIL_FROM,
            to: email,
            subject: "The Studio – Booking confirmed",
            text,
            html,
          });
        } catch (mailErr) {
          console.error("Email confirmation failed:", mailErr);
        }
      }
    }

    return Response.json(data, { status });
  } catch (err) {
    return Response.json(
      { error: "Could not reach booking calendar" },
      { status: 502 }
    );
  }
}
