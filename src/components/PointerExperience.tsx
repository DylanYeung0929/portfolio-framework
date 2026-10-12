import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
} from "motion/react";
import { useI18n } from "../lib/i18n";

// data-cursor-cycle 区域悬停时每个词停留的时长（如首页人像上轮换的多语言「我」）
const CYCLE_MS = 520;

export function PointerExperience() {
  const pointerX = useMotionValue(-100);
  const pointerY = useMotionValue(-100);
  const x = useSpring(pointerX, { stiffness: 520, damping: 34, mass: 0.35 });
  const y = useSpring(pointerY, { stiffness: 520, damping: 34, mass: 0.35 });
  const [label, setLabel] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [cycling, setCycling] = useState(false);
  const { lang } = useI18n();
  const cycleZone = useRef<HTMLElement | null>(null);
  const cycleIndex = useRef(0);
  const cycleTimer = useRef(0);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () =>
      setEnabled(finePointer.matches && !reducedMotion.matches);
    sync();
    finePointer.addEventListener("change", sync);
    reducedMotion.addEventListener("change", sync);
    // 默认标签随界面语言：法语界面用法语词，简繁与英文界面保持英文
    const fr = lang === "fr";
    const OPEN = fr ? "OUVRIR" : "OPEN";
    const VIEW = fr ? "VOIR" : "VIEW";
    const SELECT = fr ? "CLIQUER" : "SELECT";
    const DRAG = fr ? "GLISSER" : "DRAG";
    const stopCycle = () => {
      window.clearInterval(cycleTimer.current);
      cycleZone.current = null;
      setCycling(false);
    };
    const move = (event: PointerEvent) => {
      pointerX.set(event.clientX);
      pointerY.set(event.clientY);
      const target = event.target instanceof Element ? event.target : null;
      const cycleHit = target?.closest<HTMLElement>("[data-cursor-cycle]");
      if (cycleHit) {
        const words = (cycleHit.dataset.cursorCycle ?? "").split("|").filter(Boolean);
        if (words.length && cycleHit !== cycleZone.current) {
          cycleZone.current = cycleHit;
          cycleIndex.current = 0;
          setCycling(true);
          setLabel(words[0]);
          window.clearInterval(cycleTimer.current);
          cycleTimer.current = window.setInterval(() => {
            cycleIndex.current = (cycleIndex.current + 1) % words.length;
            setLabel(words[cycleIndex.current]);
          }, CYCLE_MS);
        }
        return;
      }
      if (cycleZone.current) stopCycle();
      const control = target?.closest<HTMLElement>("button, a[href], [role='button'], [role='tab'], [role='switch'], [role='slider'], input, select, textarea, summary, .cursor-pointer, .cursor-zoom-in");
      const zone = target?.closest<HTMLElement>("[data-cursor]");
      const unavailable = control?.matches(":disabled, [aria-disabled='true']");
      const editing = control?.matches("input:not([type='range']):not([type='checkbox']):not([type='radio']), textarea, select");
      const next = unavailable || editing ? "" :
        control?.matches(".cursor-zoom-in") ? VIEW :
        zone?.dataset.cursor ??
        (control?.matches("input[type='range'], [role='slider']") ? DRAG :
          control?.matches("a[href]") ? OPEN : control ? SELECT :
            target?.matches("canvas") && document.body.style.cursor === "pointer" ? VIEW : "");
      setLabel((current) => (current === next ? current : next));
    };
    const leave = () => { stopCycle(); setLabel(""); pointerX.set(-100); pointerY.set(-100); };
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      stopCycle();
      finePointer.removeEventListener("change", sync);
      reducedMotion.removeEventListener("change", sync);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("mouseleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, [pointerX, pointerY, lang]);

  if (!enabled) return null;
  return (
    <>
      <motion.div
        aria-hidden="true"
        className="pointer-dot pointer-events-none fixed left-0 top-0 z-[301] size-1.5 rounded-full bg-fg mix-blend-difference"
        style={{ x: pointerX, y: pointerY }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-glass pointer-events-none fixed left-0 top-0 z-[300] grid size-[76px] place-items-center rounded-full"
        style={{ x, y }}
        animate={{
          left: label ? 48 : 16,
          top: label ? 48 : 16,
          scale: label ? 1 : 28 / 76,
        }}
        transition={{ duration: 0.16, ease: "easeOut" }}
      >
        <AnimatePresence mode="wait">
          {label ? (
            <motion.span
              key={label}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.12 }}
              className={cycling ? "text-[22px]" : undefined}
            >
              {label}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </>
  );
}
