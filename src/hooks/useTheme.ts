import { useEffect, useLayoutEffect, useState } from "preact/hooks";
import type { Theme } from "../types";

const storageKey = "token-workshop-theme";
const systemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

function savedTheme(): Theme | null {
  try {
    const value = localStorage.getItem(storageKey);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [preference, setPreference] = useState<Theme | null>(savedTheme);
  const [system, setSystem] = useState<Theme>(systemTheme);
  const theme: Theme = preference ?? system;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (): void => setSystem(systemTheme());
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggle(): void {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setPreference(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      /* Theme still works when storage is unavailable. */
    }
  }

  return { theme, toggle };
}
