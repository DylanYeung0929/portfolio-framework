import { useCallback, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "pf-theme";
const DEFAULT_MODE: ThemeMode = "dark";

function readStored(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* 隐私模式下 localStorage 不可用，落回默认 */
  }
  return DEFAULT_MODE;
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(readStored);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#232323" : "#e1e1e1");
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* 写不进去也不影响本次会话 */
    }
  }, [theme]);
  const toggle = useCallback(
    () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    [],
  );
  return { theme, setTheme, toggle };
}
