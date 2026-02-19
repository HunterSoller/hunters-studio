# Google Apps Script for calendar booking

The file `GoogleAppsScript-CalendarBooking.gs` runs in [Google Apps Script](https://script.google.com) and connects your site to your Google Calendar.

## What it does

- **GET** (with `?month=YYYY-MM`): Reads your calendar for that month and returns which days/times are free. Any existing event (class, etc.) blocks those slots so they appear greyed out and unbookable on the site.
- **POST**: When someone submits a booking, it creates an event on your default Google Calendar with their name, contact info, and time.

## After you update the script

1. In [script.google.com](https://script.google.com), paste the latest `GoogleAppsScript-CalendarBooking.gs` into `Code.gs` and save.
2. Set timezone: **File > Project properties** → **Time zone** → **America/New_York** (Buffalo).
3. **Deploy > Manage deployments** → Edit (pencil) → **Version: New version** → **Deploy** (keep the same web app URL).
4. Your site uses the script URL from `.env.local` (`NEXT_PUBLIC_BOOKING_API_URL`). If you changed it, restart the dev server (`npm run dev`).

The script uses **America/New_York** for all event times so your calendar events (and new bookings) block the correct slots no matter the project timezone.

## Fixing "Script function not found: doGet"

That error means the deployed app doesn’t have `doGet`. Replace all code in `Code.gs` with `GoogleAppsScript-CalendarBooking.gs`, then deploy a **New version** as above. The script includes `doGet`, `doPost`, and `doOptions` (for CORS).
