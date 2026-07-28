import { LS_KEYS, loadLS, saveLS } from "./localStorage";

export function exportBackup() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bookings: loadLS(LS_KEYS.bookings, []),
    settings: loadLS(LS_KEYS.settings, {}),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fun-farmhouse-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importBackup(file) {
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") throw new Error("Invalid backup file");

  if (Array.isArray(data.bookings)) saveLS(LS_KEYS.bookings, data.bookings);
  if (data.settings && typeof data.settings === "object") saveLS(LS_KEYS.settings, data.settings);

  return {
    bookings: Array.isArray(data.bookings) ? data.bookings.length : 0,
    settings: data.settings ? Object.keys(data.settings).length : 0,
  };
}
