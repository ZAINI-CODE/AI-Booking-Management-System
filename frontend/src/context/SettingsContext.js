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
  farms: ["Al Hadi Farm", "Green Farm", "Palm Grove Farm"],
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...loadLS(LS_KEYS.settings, {}),
  }));

  useEffect(() => {
    saveLS(LS_KEYS.settings, settings);
  }, [settings]);

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
