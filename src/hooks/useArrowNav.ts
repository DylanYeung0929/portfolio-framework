import { useEffect } from "react";
import type { Route } from "../types";
import { stepRoute } from "../lib/nav";

/** ←/→ 全站翻页：输入框聚焦、带修饰键、灯箱打开时跳过。 */
export function useArrowNav(route: Route, navigate: (route: Route) => void) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (document.body.dataset.lightbox === "open") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        navigate(stepRoute(route, 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        navigate(stepRoute(route, -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [route, navigate]);
}
