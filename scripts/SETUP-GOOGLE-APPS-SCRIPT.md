# Fix "setHeader is not a function" and connect the script

The error happens because your current script (or a **library** you added) uses `output.setHeader()`, which does not exist in Google Apps Script. Use **only** the standalone script below — no libraries.

## Steps (do these in order)

### 1. Open your project
- Go to [script.google.com](https://script.google.com)
- Open the project that deploys to:  
  `https://script.google.com/macros/s/AKfycbxit-ni-NnxXWQGXJiwN2NWwx_sNJI3cm5jYThnX41ZMaMT3C9CDYWdqkATyyqvTItR/exec`

### 2. Remove the library (if you added one)
- **Libraries** in the left sidebar: if you see a library (e.g. the one from the library URL you had), click it and **Remove** it.
- The script must run with **no libraries** — only `Code.gs`.

### 3. Replace all code in Code.gs
- Open **Code.gs** in the editor.
- Select all (Ctrl+A / Cmd+A) and delete.
- Open the file **`GoogleAppsScript-CalendarBooking.gs`** in this folder (in your STUDIO project).
- Copy its **entire** contents and paste into **Code.gs** in script.google.com.
- Save (Ctrl+S / Cmd+S).

### 4. Set timezone
- **File** → **Project properties**
- Set **Time zone** to **America/New_York (Eastern Time)**.
- Save.

### 5. Deploy a new version
- **Deploy** → **Manage deployments**
- Click the **pencil (Edit)** on the existing deployment.
- Under **Version**, choose **New version**.
- Click **Deploy**.
- Leave **Web app URL** as is (same as before).

### 6. Test the script
In a browser, open:
- `https://script.google.com/macros/s/AKfycbxit-ni-NnxXWQGXJiwN2NWwx_sNJI3cm5jYThnX41ZMaMT3C9CDYWdqkATyyqvTItR/exec?month=2026-02`

You should see JSON with `"dates": { ... }`, not an error page.

### 7. Your site
Your `.env.local` already has this URL. Restart the dev server (`npm run dev`) and open the booking page — availability will load from your Google Calendar and bookings will create events.
