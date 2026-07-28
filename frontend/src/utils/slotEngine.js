// Slot conflict engine — pure functions

export const SLOT_PRESETS = {
  Morning: { start: "10:00", end: "16:00", label: "10:00 AM - 4:00 PM" },
  Evening: { start: "17:00", end: "23:00", label: "5:00 PM - 11:00 PM" },
  // Night wraps past midnight; represented as start-of-day next day (25:00 => 06:00 next day)
  Night: { start: "01:00", end: "06:00", label: "1:00 AM - 6:00 AM" },
};

/**
 * Convert "HH:MM" 24-hour input value into "H:MM AM/PM" (12-hour) display.
 * If already in AM/PM form, returns it upper-cased.
 */
export function toAmPm(t) {
  if (!t) return "";
  const s = String(t).trim().toUpperCase();
  if (/AM|PM/.test(s)) return s;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return s;
  const h = parseInt(m[1], 10);
  const min = m[2];
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${min} ${period}`;
}

/**
 * Convert an AM/PM string OR 24-hour string to "HH:MM" 24-hour for <input type="time">.
 */
export function to24(t) {
  if (!t) return "";
  const s = String(t).trim().toUpperCase();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (m) {
    let h = parseInt(m[1], 10);
    if (m[3] === "AM") h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
    return `${String(h).padStart(2, "0")}:${m[2]}`;
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return `${String(parseInt(m24[1], 10)).padStart(2, "0")}:${m24[2]}`;
  return "";
}

/**
 * Convert "HH:MM" 24-hour or "H:MM AM/PM" 12-hour into minutes-since-midnight.
 * Returns null if unparseable.
 */
export function toMinutes(t) {
  if (!t) return null;
  const s = String(t).trim().toUpperCase();
  const ampm = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (ampm) {
    let h = parseInt(ampm[1], 10);
    const m = parseInt(ampm[2], 10);
    const p = ampm[3];
    if (p === "AM") h = h === 12 ? 0 : h;
    else h = h === 12 ? 12 : h + 12;
    return h * 60 + m;
  }
  const h24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) return parseInt(h24[1], 10) * 60 + parseInt(h24[2], 10);
  return null;
}

/**
 * Given a booking, return an interval [startMinutes, endMinutes] anchored to the booking date.
 * For overnight slots (Night), we still return start/end minutes but flag wrap-around.
 * Returns { start, end, wrap } or null if invalid.
 */
export function bookingInterval(booking) {
  if (!booking) return null;
  const { timeSlot, isDoubleSlot, customStartTime, customEndTime, slotTiming } = booking;

  if (isDoubleSlot || timeSlot === "Custom") {
    const s = toMinutes(customStartTime);
    let e = toMinutes(customEndTime);
    if (s === null || e === null) return null;
    if (e === s) e += 60; // sanity
    return { start: s, end: e, wrap: e < s };
  }

  const preset = SLOT_PRESETS[timeSlot];
  if (preset) {
    const s = toMinutes(preset.start);
    const e = toMinutes(preset.end);
    return { start: s, end: e, wrap: e < s };
  }

  // Fallback: try to parse slotTiming "10:00 AM - 4:00 PM"
  if (slotTiming) {
    const parts = slotTiming.split("-").map((p) => p.trim());
    if (parts.length === 2) {
      const s = toMinutes(parts[0]);
      const e = toMinutes(parts[1]);
      if (s !== null && e !== null) return { start: s, end: e, wrap: e < s };
    }
  }
  return null;
}

/** Check if two intervals overlap on the same day, treating wrap intervals. */
function intervalsOverlap(a, b) {
  const A = a.wrap ? [{ s: a.start, e: 24 * 60 }, { s: 0, e: a.end }] : [{ s: a.start, e: a.end }];
  const B = b.wrap ? [{ s: b.start, e: 24 * 60 }, { s: 0, e: b.end }] : [{ s: b.start, e: b.end }];
  for (const x of A) {
    for (const y of B) {
      if (x.s < y.e && y.s < x.e) return true;
    }
  }
  return false;
}

/**
 * Given the candidate booking and existing bookings, return the first conflicting booking (or null).
 * Matches only when farmName + bookingDate are the same.
 */
export function findConflict(candidate, existing) {
  if (!candidate?.farmName || !candidate?.bookingDate) return null;
  const cInt = bookingInterval(candidate);
  if (!cInt) return null;

  for (const b of existing) {
    if (b.bookingId && candidate.bookingId && b.bookingId === candidate.bookingId) continue;
    if ((b.farmName || "").toLowerCase() !== (candidate.farmName || "").toLowerCase()) continue;
    if (b.bookingDate !== candidate.bookingDate) continue;
    const bInt = bookingInterval(b);
    if (!bInt) continue;
    if (intervalsOverlap(cInt, bInt)) return b;
  }
  return null;
}

export function slotTimingFor(timeSlot, customStartTime, customEndTime) {
  if (timeSlot === "Custom") {
    const s = toAmPm(customStartTime);
    const e = toAmPm(customEndTime);
    if (s && e) return `${s} - ${e}`;
    return "";
  }
  return SLOT_PRESETS[timeSlot]?.label || "";
}
