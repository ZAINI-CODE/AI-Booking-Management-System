import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { LS_KEYS, loadLS, saveLS } from "@/utils/localStorage";

const DEFAULT_SETTINGS = {
  businessName: "FUN FARMHOUSE",
  logoDataUrl: "",
  tagline: "Premium Farmhouse Reservations",
  phone: "",
  whatsapp: "",
  address: "",
  defaultNote: "Remaining balance must be cleared at the time of check-in. Management is not responsible for personal belongings.",
  farms: [
    "Sheikh Farmhouse",
    "Al-Hadi Farmhouse",
    "Butt Farmhouse",
    "Akram Farmhouse",
    "Buddy Dean's Farmhouse",
    "Harbor Farmhouse",
    "Zaman Farmhouse",
    "SK Farmhouse",
  ],
};

// One-time migration: users on older builds had these three seed farms.
// If their saved list is still exactly this set (never customised),
// upgrade to the new default farmhouse list automatically.
const LEGACY_DEFAULT_FARMS = ["Al Hadi Farm", "Green Farm", "Palm Grove Farm"];

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const loaded = loadLS(LS_KEYS.settings, {});
    const merged = { ...DEFAULT_SETTINGS, ...loaded };
    // Auto-upgrade legacy default-farm seed to the new list
    if (
      Array.isArray(merged.farms) &&
      merged.farms.length === LEGACY_DEFAULT_FARMS.length &&
      merged.farms.every((f, i) => f === LEGACY_DEFAULT_FARMS[i])
    ) {
      merged.farms = [...DEFAULT_SETTINGS.farms];
    }
    return merged;
  });

  useEffect(() => {
    saveLS(LS_KEYS.settings, settings);
  }, [settings]);

  // Sync favicon (circular) + page title with uploaded logo / brand name
  useEffect(() => {
    if (typeof document === "undefined") return;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    document.title = `${settings.businessName || "FUN FARMHOUSE"} — Booking Management`;

    if (!settings.logoDataUrl) {
      link.setAttribute("type", "image/svg+xml");
      link.href = "/favicon.svg";
      return;
    }

    // Render uploaded logo inside a circular clip via canvas → PNG data URL,
    // so browser tabs / bookmarks show a rounded favicon instead of a square one.
    const img = new Image();
    img.onload = () => {
      const size = 128;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      // Solid emerald backing ring — covers transparent PNGs cleanly
      ctx.fillStyle = "#064E3B";
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();
      // Clip to circle, then draw logo cover-fitted
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      const ratio = Math.max(size / img.width, size / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);
      ctx.restore();
      try {
        link.removeAttribute("type");
        link.href = canvas.toDataURL("image/png");
      } catch {
        link.setAttribute("type", "image/svg+xml");
        link.href = "/favicon.svg";
      }
    };
    img.onerror = () => {
      link.setAttribute("type", "image/svg+xml");
      link.href = "/favicon.svg";
    };
    img.src = settings.logoDataUrl;
  }, [settings.logoDataUrl, settings.businessName]);

  const updateSettings = useCallback((patch) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const addFarm = useCallback((name) => {
    const clean = String(name || "").trim();
    if (!clean) return;
    setSettings((s) => {
      if (s.farms.some((f) => f.toLowerCase() === clean.toLowerCase())) return s;
      return { ...s, farms: [...s.farms, clean] };
    });
  }, []);

  const removeFarm = useCallback((name) => {
    setSettings((s) => ({ ...s, farms: s.farms.filter((f) => f !== name) }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, addFarm, removeFarm }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}
