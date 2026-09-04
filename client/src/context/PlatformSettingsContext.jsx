import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../services/api";

const PlatformSettingsContext = createContext(null);

const DEFAULTS = {
  primary_color: "#F59E0B",
  font_family: "Geist Variable, sans-serif",
  use_emoji: "true",
  website_logo: "",
  profile_photo_style: "circle",
  contact_email: "",
  contact_phone: "",
  contact_location: "",
  our_mission: "",
  our_vision: "",
};

function hexToHSL(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function deriveColors(hex) {
  const hsl = hexToHSL(hex);
  const hover = hslToHex(hsl.h, Math.min(hsl.s, 100), Math.max(hsl.l - 10, 0));
  const light = hslToHex(hsl.h, Math.min(hsl.s, 100), Math.min(hsl.l + 15, 95));
  return { base: hex, hover, light };
}

function applyCSSVariables(settings) {
  const root = document.documentElement;

  const primary = settings.primary_color || DEFAULTS.primary_color;
  const colors = deriveColors(primary);

  root.style.setProperty("--primary", colors.base);
  root.style.setProperty("--ring", colors.base);
  root.style.setProperty("--color-theme-primary", colors.base);
  root.style.setProperty("--color-theme-primary-hover", colors.hover);
  root.style.setProperty("--color-theme-primary-light", colors.light);
  root.style.setProperty("--sidebar-primary", colors.base);
  root.style.setProperty("--sidebar-ring", colors.base);

  const font = settings.font_family || DEFAULTS.font_family;
  root.style.setProperty("--font-sans", font);
}

function clearCSSVariables() {
  const root = document.documentElement;
  ["--primary", "--ring", "--color-theme-primary", "--color-theme-primary-hover",
   "--color-theme-primary-light", "--sidebar-primary", "--sidebar-ring", "--font-sans"
  ].forEach((prop) => root.style.removeProperty(prop));
}

export function PlatformSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.get("/public/platform-settings");
      const db = res.data.settings || {};
      const merged = { ...DEFAULTS, ...db };
      setSettings(merged);
      applyCSSVariables(merged);
    } catch (err) {
      console.error("Failed to load platform settings:", err);
      applyCSSVariables(DEFAULTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    return () => clearCSSVariables();
  }, []);

  const get = useCallback((key) => settings[key] ?? DEFAULTS[key] ?? "", [settings]);

  const value = useMemo(() => ({
    settings,
    loading,
    get,
    refresh: fetchSettings,
  }), [settings, loading, get, fetchSettings]);

  return (
    <PlatformSettingsContext.Provider value={value}>
      {children}
    </PlatformSettingsContext.Provider>
  );
}

export function usePlatformSettings() {
  const ctx = useContext(PlatformSettingsContext);
  if (!ctx) throw new Error("usePlatformSettings must be used within PlatformSettingsProvider");
  return ctx;
}
