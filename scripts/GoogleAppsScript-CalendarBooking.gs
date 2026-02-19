/**
 * Google Apps Script: Calendar booking for The Studio
 *
 * SETUP:
 * 1. Open script.google.com and open the project that is already deployed at
 *    your web app URL (or create a new project and deploy it).
 * 2. Replace the script content with this entire file (Code.gs).
 * 3. Set timezone: File > Project properties > Time zone: America/New_York (Buffalo).
 * 4. Deploy: Deploy > Manage deployments > Edit (pencil) > Version: New version >
 *    Deploy. (Or Deploy > New deployment > Web app, then use that URL.)
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Set NEXT_PUBLIC_BOOKING_API_URL in .env.local to your web app URL.
 *
 * Uses your default Google Calendar. Busy times (class, etc.) are greyed out;
 * when someone books, an event is created on the same calendar.
 */

var TIMEZONE = 'America/New_York';
var SLOT_START_HOUR = 10;   // 10:00 AM
var SLOT_END_HOUR = 24;     // 24 = last slot start 23:00 (11 PM)
var SLOT_LABELS = ['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00'];

function doGet(e) {
  try {
    var monthParam = (e && e.parameter && e.parameter.month) ? e.parameter.month : '';
    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return jsonResponse(400, { error: 'Missing month param. Use ?month=YYYY-MM' });
    }
    var parts = monthParam.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1; // 0-indexed

    var calendar = CalendarApp.getDefaultCalendar();
    if (!calendar) {
      return jsonResponse(500, { error: 'No default calendar. Set a default in Google Calendar.' });
    }
    var startOfMonth = new Date(year, month, 1);
    var endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
    var events = calendar.getEvents(startOfMonth, endOfMonth);

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var currentMinutes = now.getHours() * 60 + now.getMinutes();

    var dates = {};
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(year, month, d);
      var dateKey = year + '-' + pad(month + 1) + '-' + pad(d);
      if (date < today) {
        dates[dateKey] = { status: 'past', slots: [] };
        continue;
      }
      var busyMinutes = getBusyMinutesForDay(year, month, d, events);
      var slots = [];
      var isToday = date.getTime() === today.getTime();
      for (var h = SLOT_START_HOUR; h < SLOT_END_HOUR; h++) {
        if (isToday && (h * 60) <= currentMinutes) continue; // skip past slots for today
        var slotStart = h * 60;
        var slotEnd = (h + 1) * 60;
        if (!isSlotBusy(slotStart, slotEnd, busyMinutes)) {
          slots.push(pad(h) + ':00');
        }
      }
      dates[dateKey] = { status: slots.length ? 'available' : 'busy', slots: slots };
    }

    return jsonResponse(200, { dates: dates });
  } catch (err) {
    return jsonResponse(500, { error: 'Calendar error: ' + (err.message || String(err)) });
  }
}

function doPost(e) {
  try {
    var body;
    try {
      body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    } catch (parseErr) {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }
    var firstName = body.firstName || '';
    var lastName = body.lastName || '';
    var dateStr = body.date || '';
    var startTime = body.startTime || '';
    var endTime = body.endTime || '';
    var email = body.email || '';
    var phone = body.phone || '';
    var instagram = body.instagram || '';
    var notes = body.notes || '';
    var quote = body.quote;

    if (!dateStr || !startTime || !endTime) {
      return jsonResponse(400, { error: 'Missing date, startTime, or endTime' });
    }

    var calendar = CalendarApp.getDefaultCalendar();
    if (!calendar) {
      return jsonResponse(500, { error: 'No default calendar. Set a default in Google Calendar.' });
    }
    var title = 'Studio: ' + (firstName + ' ' + lastName).trim() || 'Booking';
    var desc = [
      'Email: ' + email,
      'Phone: ' + phone,
      'Instagram: ' + instagram,
      notes ? 'Notes: ' + notes : '',
      quote != null ? 'Quote: $' + quote : ''
    ].filter(Boolean).join('\n');

    var start = parseLocalDateTime(dateStr, startTime);
    var end = parseLocalDateTime(dateStr, endTime);
    if (!start || !end || end <= start) {
      return jsonResponse(400, { error: 'Invalid date or time range' });
    }
    if (start < new Date()) {
      return jsonResponse(400, { error: 'Cannot book a time in the past' });
    }

    calendar.createEvent(title, start, end, { description: desc });
    return jsonResponse(200, { success: true });
  } catch (err) {
    return jsonResponse(500, { error: 'Booking error: ' + (err.message || String(err)) });
  }
}

function getBusyMinutesForDay(year, month, day, events) {
  var dateStr = year + '-' + pad(month + 1) + '-' + pad(day);
  var list = [];
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var start = ev.getStartTime();
    var end = ev.getEndTime();
    var startStr = Utilities.formatDate(start, TIMEZONE, 'yyyy-MM-dd');
    var endStr = Utilities.formatDate(end, TIMEZONE, 'yyyy-MM-dd');
    if (startStr !== dateStr && endStr !== dateStr) continue;
    var sHour = parseInt(Utilities.formatDate(start, TIMEZONE, 'H'), 10);
    var sMin = parseInt(Utilities.formatDate(start, TIMEZONE, 'm'), 10);
    var eHour = parseInt(Utilities.formatDate(end, TIMEZONE, 'H'), 10);
    var eMin = parseInt(Utilities.formatDate(end, TIMEZONE, 'm'), 10);
    var s = sHour * 60 + sMin;
    var e = eHour * 60 + eMin;
    if (startStr !== dateStr) s = 0;
    if (endStr !== dateStr) e = 24 * 60;
    list.push([s, e]);
  }
  return list;
}

function isSlotBusy(slotStart, slotEnd, busyMinutes) {
  for (var i = 0; i < busyMinutes.length; i++) {
    var b = busyMinutes[i];
    if (slotStart < b[1] && slotEnd > b[0]) return true;
  }
  return false;
}

function parseLocalDateTime(dateStr, timeStr) {
  var match = (timeStr || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  var hour = parseInt(match[1], 10);
  var min = parseInt(match[2], 10);
  var datePart = dateStr.split('T')[0];
  var parts = datePart.split('-');
  if (parts.length !== 3) return null;
  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10) - 1;
  var day = parseInt(parts[2], 10);
  return new Date(year, month, day, hour, min, 0, 0);
}

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}

/** Allow CORS preflight (OPTIONS) so POST from your site works. */
function doOptions(e) {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function jsonResponse(code, data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
