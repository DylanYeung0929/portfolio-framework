import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronLeft, ChevronRight, Mail, Menu, Moon, Sun, X } from "lucide-react";
import type { ThemeMode } from "../hooks/useTheme";
import type { Route } from "../types";
import { navItems, stepRoute } from "../lib/nav";
import { themes } from "../lib/themes";
import { LANG_ABBR, LANG_LABEL, useI18n } from "../lib/i18n";
import type { Lang } from "../lib/i18n";

const chromeBtn =
  "glass-control grid size-11 place-items-center rounded-full border border-line/15 text-fg/65 transition-colors hover:border-line/40 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500";

// 语言选择面板：2×2 四格——左上简中、右上繁中、左下英文、右下法文
const LANG_CELLS: { option: Lang; cell: string }[] = [
  { option: "zh-Hans", cell: "tl" },
  { option: "zh-Hant", cell: "tr" },
  { option: "en", cell: "bl" },
  { option: "fr", cell: "br" },
];

// 占位邮箱：替换成你自己的
const EMAIL = "you@example.com";
const swap = { duration: 0.24, ease: [0.22, 1, 0.36, 1] } as const;

function EmailCopy() {
  const { pick } = useI18n();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      // 剪贴板 API 在非安全上下文/无权限时不可用，退回选区复制
      const ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.style.cssText = "position:fixed;top:-100px;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
  };
  return (
    <motion.button
      type="button"
      onClick={copy}
      whileTap={{ scale: 0.95 }}
      aria-label={pick(`复制邮箱 ${EMAIL}`, `Copy email ${EMAIL}`, `Copier l'adresse ${EMAIL}`)}
      className="relative flex items-center justify-center gap-2 rounded-full border border-line/15 px-3 py-1.5 text-[11px] tracking-[.06em] text-fg/65 transition-colors hover:border-line/40 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500 sm:min-w-[13.5rem]"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={swap}
            className="flex items-center gap-2 text-fg"
          >
            <Check className="size-3.5" aria-hidden="true" />
            <span>{pick("已复制", "Copied", "Copié")}</span>
          </motion.span>
        ) : (
          <motion.span
            key="mail"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={swap}
            className="flex items-center gap-2"
          >
            <Mail className="size-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{EMAIL}</span>
          </motion.span>
        )}
      </AnimatePresence>
      {copied && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full border border-accent-cyan-500"
          initial={{ opacity: 0.75, scale: 1 }}
          animate={{ opacity: 0, scale: 1.35 }}
          transition={{ duration: 0.75, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}

export function AppHeader({
  route,
  navigate,
  theme,
  onToggleTheme,
}: {
  route: Route;
  navigate: (route: Route) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const { lang, setLang, pick, pickT } = useI18n();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const go = (next: Route) => {
    setOpen(false);
    navigate(next);
  };
  useEffect(() => {
    if (!langOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLangOpen(false);
    };
    const onDown = (event: PointerEvent) => {
      if (!langRef.current?.contains(event.target as Node)) setLangOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [langOpen]);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowRight") go(stepRoute(route, 1));
      if (event.key === "ArrowLeft") go(stepRoute(route, -1));
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, route]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 lg:px-8">
        {route === "home" ? (
          <EmailCopy />
        ) : (
          <button
            onClick={() => go("home")}
            className="translate-y-2 rounded-lg font-serif text-2xl font-medium tracking-tight text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500"
            aria-label={pick("返回首页", "Back to home")}
          >
            Portfolio<span className="text-muted">.</span>
          </button>
        )}
        <div className="flex items-center gap-2">
          <button className={chromeBtn} onClick={() => go(stepRoute(route, -1))} aria-label={pick("上一节", "Previous section", "Section précédente")}>
            <ChevronLeft className="size-4" />
          </button>
          <button className={chromeBtn} onClick={() => go(stepRoute(route, 1))} aria-label={pick("下一节", "Next section", "Section suivante")}>
            <ChevronRight className="size-4" />
          </button>
          <button className={chromeBtn} onClick={onToggleTheme} aria-label={theme === "dark" ? pick("切换到浅色", "Switch to light", "Passer en clair") : pick("切换到深色", "Switch to dark", "Passer en sombre")}>
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <div ref={langRef} className="relative">
            {/* 收起态圆钮：显示当前语言缩写（想做国旗面板，把这里换成旗图即可） */}
            <button
              data-lang-orb
              className={chromeBtn}
              onClick={() => setLangOpen((value) => !value)}
              aria-label={pick("切换语言", "Change language", "Changer de langue")}
              aria-expanded={langOpen}
              aria-haspopup="menu"
            >
              <span data-lang-flag={lang} className="text-[13px] font-semibold tracking-wide">
                {LANG_ABBR[lang]}
              </span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  role="menu"
                  style={{ x: "-50%" }}
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15, ease: "easeIn" } }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="glass-control lang-glass-panel absolute left-1/2 top-[calc(100%+10px)] z-50 h-[98px] w-[186px] p-1"
                >
                  <div className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden rounded-lg">
                    {LANG_CELLS.map(({ option, cell }, index) => (
                      <button
                        key={option}
                        type="button"
                        role="menuitemradio"
                        aria-checked={option === lang}
                        data-lang-cell={cell}
                        onClick={() => {
                          setLang(option);
                          setLangOpen(false);
                        }}
                        className={`group relative block h-11 w-[88px] border-line/20 text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-cyan-500 ${index % 2 === 1 ? "border-l" : ""} ${index > 1 ? "border-t" : ""}`}
                      >
                        <span aria-hidden="true" className="absolute inset-0 bg-panel/40 transition-colors group-hover:bg-fg/10" />
                        {option === lang && <span aria-hidden="true" className="absolute inset-0 ring-2 ring-inset ring-fg/60" />}
                        <span className={`relative z-10 flex h-full flex-col items-center justify-center gap-0.5 ${option === "zh-Hans" || option === "zh-Hant" ? "font-serif" : ""}`}>
                          <span className="text-[13px] font-semibold">{LANG_ABBR[option]}</span>
                          <span className="text-[9px] tracking-[.08em] text-muted">{LANG_LABEL[option]}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button className={chromeBtn} onClick={() => { setLangOpen(false); setOpen(true); }} aria-label={pick("打开导航", "Open navigation", "Ouvrir la navigation")}>
            <Menu className="size-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 overflow-y-auto bg-bg/95 backdrop-blur-2xl"
          >
            <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 lg:px-8">
              <span className="text-[10px] tracking-[.34em] text-muted">{pick("EXPLORE", "EXPLORE", "EXPLORER")}</span>
              <button className={chromeBtn} onClick={() => setOpen(false)} aria-label={pick("关闭导航", "Close navigation")}>
                <X className="size-4" />
              </button>
            </div>
            <nav className="mx-auto max-w-[1600px] px-5 pb-16 lg:px-8" aria-label={pick("主要导航", "Main navigation")}>
              {navItems.map((item, index) => (
                <motion.button
                  key={item.route}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + index * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  onClick={() => go(item.route)}
                  className="group flex w-full items-baseline justify-between gap-6 border-b border-line/10 py-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500"
                >
                  <span className="flex items-baseline gap-4">
                    <span
                      className="size-1.5 shrink-0 translate-y-[-0.35em] rounded-full"
                      style={{ background: themes[item.route].gradFrom }}
                      aria-hidden="true"
                    />
                    <span className={`font-serif text-4xl transition-colors md:text-6xl ${lang === "en" || lang === "fr" ? "display-en" : ""} ${route === item.route ? "text-fg" : "text-fg/60 group-hover:text-fg"}`}>
                      {pickT(item.zhHans, item.zh, item.en, item.fr)}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-[10px] tracking-[.3em] text-muted sm:block">{pickT(item.en, item.en, item.zh, item.zh)}</span>
                </motion.button>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
