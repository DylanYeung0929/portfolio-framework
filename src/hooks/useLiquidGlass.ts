import { useEffect } from "react";
import "hyalite";

// 折射的控件选择器：成组匹配一次即可，别把已折射工具栏里的每个按钮再匹配一遍
const controls = ".liquid-button, .glass-control";

export function useLiquidGlass() {
  useEffect(() => {
    const root = document.body;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const contrast = window.matchMedia("(prefers-contrast: more)");
    const transparency = window.matchMedia("(prefers-reduced-transparency: reduce)");
    let watcher: ReturnType<typeof window.Hyalite.watch> | undefined;
    let pointerWatcher: ReturnType<typeof window.Hyalite.watch> | undefined;
    const sync = () => {
      watcher?.stop();
      pointerWatcher?.stop();
      watcher = undefined;
      pointerWatcher = undefined;
      // hyalite 只在 Chromium 引擎上绘制；WebKit/Firefox 上不写任何东西，CSS 兜底自然生效。
      // 下面的标记告诉 CSS 当前处于哪种世界——不折射的环境改用加强磨砂（发丝线 + 内高光）。
      if (contrast.matches || transparency.matches) {
        delete document.documentElement.dataset.glass;
        return;
      }
      watcher = window.Hyalite.watch(root, controls, {
        // 保留上游透镜强度（含折叠与色散）。光学边缘已在滤镜里，再叠一圈 CSS 边缘会发双重边。
        ...window.Hyalite.DEFAULTS,
        edge: 0,
        materialize: reduced.matches ? 0 : 180, settle: 120,
      });
      // 固定布局几何 + 纯 transform 跟随，避免逐帧重建透镜贴图
      pointerWatcher = window.Hyalite.watch(root, ".pointer-glass", {
        ...window.Hyalite.DEFAULTS, edge: 0, materialize: 0, settle: 0,
      });
      if (window.Hyalite.supported()) document.documentElement.dataset.glass = "refract";
      else delete document.documentElement.dataset.glass;
    };
    sync();
    const preferences = [reduced, contrast, transparency];
    preferences.forEach(query => query.addEventListener("change", sync));
    return () => {
      watcher?.stop();
      pointerWatcher?.stop();
      preferences.forEach(query => query.removeEventListener("change", sync));
      delete document.documentElement.dataset.glass;
    };
  }, []);
}
