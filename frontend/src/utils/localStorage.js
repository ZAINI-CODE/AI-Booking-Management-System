export const LS_KEYS = {
  bookings: "ff_bookings_v1",
  settings: "ff_settings_v1",
};

export function loadLS(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveLS(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function clearLS(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
