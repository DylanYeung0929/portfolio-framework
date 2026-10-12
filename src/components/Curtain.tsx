import { motion } from "motion/react";
import { useI18n } from "../lib/i18n";
import { PLACEHOLDER_SIG } from "../lib/brand";

/**
 * 整屏幕布：首访时自滑出一次；章节加载时按住（hold）直到内容就绪才上滑揭开。
 *
 * hold=true  → 停在屏上，笔迹描到 97% 悬停等待
 * hold=false → 完成落笔并上滑离场（intro 时笔迹更慢、更完整）
 */
export function Curtain({
  kicker,
  hold,
  releaseDelay = 1.05,
  intro = false,
}: {
  kicker: string;
  hold: boolean;
  releaseDelay?: number;
  intro?: boolean;
}) {
  const { pickT } = useI18n();
  const sig = PLACEHOLDER_SIG;
  return (
    <motion.div
      data-curtain
      className="fixed inset-0 z-[60] grid place-items-center bg-bg"
      initial={{ y: 0 }}
      animate={{ y: hold ? "0%" : "-101%" }}
      transition={{ duration: 0.8, delay: hold ? 0 : releaseDelay, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="flex flex-col items-center gap-5 px-6 text-center">
        <span className="text-[11px] tracking-[.34em] text-muted">{kicker}</span>
        <span className="font-serif text-[clamp(2.4rem,6vw,3.9rem)] font-medium leading-none text-fg">
          {pickT("你的名字", "你的名字", "Your Name", "Votre nom")}
        </span>
        <svg aria-hidden="true" viewBox={`0 0 ${sig.w} ${sig.h}`} className="w-[min(86vw,32rem)]">
          {/* 笔画描摹：加载中沿路径「运笔」，就绪后落笔收尾；换自己的笔迹见 lib/brand.ts */}
          <motion.path
            d={sig.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-fg/60"
            initial={{ pathLength: 0, opacity: 1 }}
            animate={{ pathLength: hold ? [0, 0.9, 0.97] : 1, opacity: hold ? 1 : [1, 0] }}
            transition={{
              pathLength: hold
                ? { duration: 7.3, times: [0, 0.178, 1], ease: [[0.65, 0, 0.35, 1], "linear"] }
                : { duration: intro ? 0.85 : 0.3, ease: [0.65, 0, 0.35, 1] },
              opacity: hold ? { duration: 0.3 } : { delay: intro ? 0.5 : 0.3, duration: 0.35 },
            }}
          />
        </svg>
      </div>
    </motion.div>
  );
}
