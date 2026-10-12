import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { getLenis } from "../hooks/useSmoothScroll";
import { useI18n } from "../lib/i18n";

// 滚动超过这个距离才浮现，避免短页面闪进闪出
const SHOW_AFTER = 480;
const R = 20;
const CIRC = 2 * Math.PI * R;

export function BackToTop() {
  const { pick } = useI18n();
  const [show, setShow] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;
    const read = () => {
      frame = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(y > SHOW_AFTER);
      setProgress(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const toTop = () => {
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          onClick={toTop}
          data-cursor={pick("TOP", "TOP", "HAUT")}
          aria-label={pick("回到顶部", "Back to top", "Retour en haut")}
          initial={{ opacity: 0, y: 14, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 14, scale: 0.92 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.94 }}
          className="fixed bottom-6 right-5 z-30 grid size-11 place-items-center rounded-full border border-line/15 bg-bg/75 text-fg/70 backdrop-blur-md transition-colors hover:border-line/40 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500 lg:bottom-8 lg:right-8"
        >
          <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 44 44" aria-hidden="true">
            <circle cx="22" cy="22" r={R} fill="none" stroke="currentColor" strokeWidth="1.5" className="text-line/20" />
            <circle
              cx="22"
              cy="22"
              r={R}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              className="text-fg/55"
            />
          </svg>
          <ArrowUp className="size-4" aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
