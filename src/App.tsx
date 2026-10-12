import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AppHeader } from "./components/AppHeader";
import type { Route } from "./types";
import { getLenis, useSmoothScroll } from "./hooks/useSmoothScroll";
import { usePreviewMask } from "./hooks/usePreviewMask";
import { useLiquidGlass } from "./hooks/useLiquidGlass";
import { useArrowNav } from "./hooks/useArrowNav";
import { useTheme } from "./hooks/useTheme";
import { PointerExperience } from "./components/PointerExperience";
import { GateScreen, GATE_TTL_MS, readGate, readGateAt } from "./components/GateScreen";
import { Curtain } from "./components/Curtain";
import { SiteFooter } from "./components/SiteFooter";
import { BackToTop } from "./components/BackToTop";
import { AmbientColorField } from "./components/AmbientColorField";
import { useI18n } from "./lib/i18n";
import { CHAPTER_LABELS } from "./lib/chapters";

const HomePage = lazy(() =>
  import("./pages/HomePage").then((module) => ({ default: module.HomePage })),
);
const SectionPage = lazy(() =>
  import("./pages/SectionPage").then((module) => ({ default: module.SectionPage })),
);

const validRoutes: Route[] = [
  "home",
  "gallery",
  "photography",
  "projects",
  "research",
  "artworks",
  "design",
];
const readRoute = (): Route => {
  const value = window.location.hash.slice(1).split("/")[0] as Route;
  return validRoutes.includes(value) ? value : "home";
};

const INTRO_KEY = "pf-intro";
const prefersReduced = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const readIntro = () => {
  if (typeof window === "undefined") return false;
  if (readRoute() !== "home") return false;
  if (prefersReduced()) return false;
  try {
    return sessionStorage.getItem(INTRO_KEY) !== "1";
  } catch {
    return false;
  }
};

const GATE_ROUTES = [
  "home",
  "gallery",
  "photography",
  "projects",
  "research",
  "artworks",
  "design",
] as const;
type GateRoute = (typeof GATE_ROUTES)[number];
const isGated = (route: Route): route is GateRoute =>
  (GATE_ROUTES as readonly string[]).includes(route);

// 访客码门禁：默认只保护「项目经历」与「科研经历」；从任何入口导航到这两页都会被拦。
// 想让其他章节也受保护，把路由名加进来即可（章节名见 lib/chapters.ts）。
const LOCKED_ROUTES = ["projects", "research"] as const;
const isLocked = (route: Route) =>
  (LOCKED_ROUTES as readonly string[]).includes(route);

type Gate = { route: GateRoute; nonce: number; ready: boolean };
const initGate = (): Gate | null => {
  const route = readRoute();
  if (!isGated(route) || readIntro() || prefersReduced()) return null;
  if (isLocked(route) && !readGate()) return null;
  return { route, nonce: 0, ready: false };
};

export default function App() {
  useLiquidGlass();
  const { pick, pickT } = useI18n();
  const [route, setRoute] = useState<Route>(readRoute);
  const [intro, setIntro] = useState(readIntro);
  const [gate, setGate] = useState<Gate | null>(initGate);
  const [unlocked, setUnlocked] = useState(readGate);
  // 设计预览：不写访客凭证，仅本次会话临时放行受保护章节（内容由遮罩覆盖）
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    const onHash = () => {
      const next = readRoute();
      // 章内 hash 详情变化：保持滚动位置、不触发章节幕布
      if (next === route) return;
      window.scrollTo(0, 0);
      setRoute(next);
      // 访客码未过或凭证已过期：内容章节只渲染门禁屏，不叠章节幕布；预览模式下继续放映幕布
      if (isLocked(next)) {
        const fresh = readGate();
        setUnlocked(fresh);
        if (!fresh && !preview) {
          setGate(null);
          setIntro(false);
          return;
        }
      }
      if (!isGated(next) || prefersReduced()) {
        setGate(null);
        return;
      }
      setIntro(false);
      setGate((prev) =>
        prev && !prev.ready
          ? { ...prev, route: next }
          : { route: next, nonce: (prev?.nonce ?? -1) + 1, ready: false },
      );
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [route, preview]);
  const navigate = useCallback((next: Route) => {
    window.location.hash = next;
  }, []);
  // 访客码通过：解锁站点并为当前章节拉起章节幕布（门禁上滑落幕后接力）
  const passGate = useCallback(() => {
    setUnlocked(true);
    setIntro(false);
    const next = readRoute();
    if (isGated(next) && !prefersReduced()) {
      setGate({ route: next, nonce: 0, ready: false });
    }
  }, []);
  // 仅查看设计：不写凭证、不设 unlocked；同样以章节幕布接力，内容全程由遮罩覆盖
  const previewGate = useCallback(() => {
    setPreview(true);
    setIntro(false);
    const next = readRoute();
    if (isGated(next) && !prefersReduced()) {
      setGate({ route: next, nonce: 0, ready: false });
    }
  }, []);
  useEffect(() => {
    if (!intro) return;
    try {
      sessionStorage.setItem(INTRO_KEY, "1");
    } catch {
      /* 无痕模式下忽略 */
    }
    const timer = window.setTimeout(() => setIntro(false), 1900);
    return () => window.clearTimeout(timer);
  }, [intro]);
  // 章节加载幕布：等 lazy 模块挂载 + 字体 + 视口内图片解码完成后才揭开
  useEffect(() => {
    if (!gate || gate.ready) return;
    const { route: gateRoute, nonce } = gate;
    let alive = true;
    const started = performance.now();
    const MIN_MS = 1300;
    const CAP_MS = 9000;
    const wait = (ms: number) =>
      new Promise<void>((resolve) => window.setTimeout(resolve, ms));
    const settle = () =>
      setGate((g) =>
        g && g.route === gateRoute && g.nonce === nonce ? { ...g, ready: true } : g,
      );
    void (async () => {
      const deadline = started + CAP_MS;
      const untilDeadline = () => wait(Math.max(0, deadline - performance.now()));
      while (alive && performance.now() < deadline) {
        const view = document.querySelector(`[data-route-view="${gateRoute}"]`);
        if (view && !view.querySelector("[data-route-fallback]")) break;
        await wait(90);
      }
      if (!alive) return;
      await Promise.race([document.fonts.ready.catch(() => {}), untilDeadline()]);
      // 两遍扫描捕获迟挂载图；先按 lazy/视口过滤，再 decode（decode 会触发未加载图的请求）
      for (let pass = 0; pass < 2 && alive; pass++) {
        const view = document.querySelector(`[data-route-view="${gateRoute}"]`);
        if (view) {
          const imgs = [...view.querySelectorAll("img")].filter((img) => {
            if (!img.getAttribute("src") && !img.currentSrc) return false;
            if (img.loading !== "lazy") return true;
            const rect = img.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return false;
            return (
              rect.top < window.innerHeight * 1.2 &&
              rect.bottom > -window.innerHeight * 0.2
            );
          });
          await Promise.race([
            Promise.allSettled(imgs.map((img) => img.decode().catch(() => {}))),
            untilDeadline(),
          ]);
        }
        await wait(140);
      }
      if (!alive) return;
      await wait(Math.max(0, started + MIN_MS - performance.now()));
      settle();
    })();
    return () => {
      alive = false;
    };
  }, [gate?.route, gate?.nonce, gate?.ready]);
  useEffect(() => {
    if (!gate?.ready) return;
    const { route: gateRoute, nonce } = gate;
    const timer = window.setTimeout(
      () =>
        setGate((g) =>
          g && g.route === gateRoute && g.nonce === nonce ? null : g,
        ),
      1600,
    );
    return () => window.clearTimeout(timer);
  }, [gate]);
  // 凭证半小时到期：驻留页面到点自动回门禁（DEV 下 readGate 恒为真，不生效）
  useEffect(() => {
    if (!unlocked || !isLocked(route)) return;
    const at = readGateAt();
    if (!Number.isFinite(at)) return;
    const timer = window.setTimeout(
      () => {
        if (!readGate()) setUnlocked(false);
      },
      Math.max(0, at + GATE_TTL_MS - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [unlocked, route]);
  useSmoothScroll(route);
  // 幕布按住期间锁滚动（揭示滑出后解锁）
  useEffect(() => {
    if (!gate) return;
    getLenis()?.stop();
    return () => getLenis()?.start();
  }, [gate?.route]);
  useArrowNav(route, navigate);
  const { theme, toggle } = useTheme();
  const isDeck = route === "home";
  // 未解锁且非预览时，内容章节整屏替换为访客门禁
  const locked = !unlocked && !preview && isLocked(route);
  const previewing = preview && isLocked(route);
  usePreviewMask(previewing);
  if (locked) return <GateScreen onPass={passGate} onPreview={previewGate} />;
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <AmbientColorField />
      <PointerExperience />
      <AppHeader route={route} navigate={navigate} theme={theme} onToggleTheme={toggle} />
      <AnimatePresence>{intro && <Curtain kicker="PORTFOLIO · 2026" hold={false} intro />}</AnimatePresence>
      {gate && !intro && (
        <Curtain
          key={gate.nonce}
          kicker={pickT(...CHAPTER_LABELS[gate.route])}
          hold={!gate.ready}
          releaseDelay={0.75}
        />
      )}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={route}
          data-route-view={route}
          data-preview={previewing ? "1" : undefined}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12, transition: { duration: 0.2, ease: "easeIn" } }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <Suspense
            fallback={
              <div
                data-route-fallback
                className="grid min-h-[72dvh] place-items-center text-sm tracking-[.22em] text-muted"
                role="status"
              >
                {pick("正在整理这一章…", "Loading this chapter…")}
              </div>
            }
          >
            {route === "home" && <HomePage navigate={navigate} />}
            {route !== "home" && <SectionPage route={route} navigate={navigate} />}
          </Suspense>
        </motion.div>
      </AnimatePresence>
      {previewing && (
        <div
          data-preview-banner
          className="pointer-events-none fixed inset-x-0 top-20 z-[55] flex justify-center px-4"
        >
          <div className="pointer-events-auto flex max-w-[92vw] flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-line/25 bg-bg/85 px-5 py-2.5 shadow-[0_18px_50px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
            <span className="text-[11px] tracking-[.18em] text-fg/75">
              {pickT(
                "设计预览 · 完整内容需凭访客码查看",
                "設計預覽 · 完整內容需憑訪客碼查看",
                "Design preview · full content needs the guest code",
                "Aperçu du design · le contenu complet nécessite le code invité",
              )}
            </span>
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="rounded-full border border-fg/25 bg-fg/5 px-4 py-1.5 text-[11px] tracking-[.18em] text-fg transition-colors hover:bg-fg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet-400"
            >
              {pickT("输入访客码", "輸入訪客碼", "Enter guest code", "Saisir le code invité")}
            </button>
          </div>
        </div>
      )}
      {!isDeck && <SiteFooter navigate={navigate} />}
      {!isDeck && <BackToTop />}
    </div>
  );
}
