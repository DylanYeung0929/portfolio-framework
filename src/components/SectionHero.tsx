import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { themes } from "../lib/themes";
import { useI18n } from "../lib/i18n";

type Props = {
  /** 章节标签（可选），渲染在 eyebrow 上方 */
  chapter?: string;
  eyebrow: string;
  titleEn: string;
  titleZh: string;
  /** 简体副标题；缺省回退 titleZh（繁体） */
  titleZhHans?: string;
  /** 法语大标题：预排大小写，不进 titleCase；缺省回退 titleEn */
  titleFr?: string;
  desc: string;
  theme: keyof typeof themes;
  stats?: [string, string][];
  children?: ReactNode;
};

const titleCase = (value: string) =>
  value.toLowerCase().replace(/\b[a-z]/g, (char) => char.toUpperCase());

export function SectionHero({ chapter, eyebrow, titleEn, titleZh, titleZhHans, titleFr, desc, theme, stats, children }: Props) {
  const { lang } = useI18n();
  const t = themes[theme];
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap
        .timeline()
        .fromTo(
          ".hero-line",
          { y: 52, opacity: 0, clipPath: "inset(0% 0% 108% 0%)" },
          {
            y: 0,
            opacity: 1,
            clipPath: "inset(0% 0% -12% 0%)",
            stagger: 0.13,
            duration: 1.05,
            ease: "power4.out",
          },
        )
        .fromTo(
          ".hero-detail",
          { y: 22, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.08, duration: 0.65, ease: "power3.out" },
          "-=.6",
        );
    },
    { scope: root },
  );
  return (
    <section ref={root} className="relative isolate overflow-hidden px-5 pb-16 pt-32 lg:px-8 lg:pt-40">
      <div className="mx-auto max-w-[1600px]">
        <div className="max-w-[62ch]">
          {chapter ? <p className="hero-detail mb-3 text-[.875rem] text-muted">{chapter}</p> : null}
          <p className={`hero-detail text-[11px] tracking-[.34em] ${t.text}`}>{eyebrow}</p>
          <h1 className="display-en hero-line mt-5 text-[clamp(2.8rem,8vw,6.25rem)] font-medium leading-[.94] text-fg">
            {lang === "fr" ? (titleFr ?? titleEn) : titleCase(titleEn)}
            <span className="accent-dot">.</span>
          </h1>
          <p className="hero-line mt-3 font-serif text-[clamp(1.5rem,3.8vw,2.75rem)] leading-[1.14] text-fg/70">
            {lang === "zh-Hans" ? (titleZhHans ?? titleZh) : titleZh}
          </p>
          <p className="hero-detail mt-7 max-w-[46ch] text-pretty text-[16.5px] leading-[1.85] text-fg/65">
            {desc}
          </p>
          {stats ? (
            <ul className="hero-detail mt-10 flex flex-wrap gap-x-12 gap-y-5 border-t border-line/12 pt-6">
              {stats.map(([num, label]) => (
                <li key={label} className="flex items-baseline gap-2.5">
                  <strong className={`display-en text-3xl font-medium ${t.text}`}>{num}</strong>
                  <span className="text-[12.5px] tracking-[.12em] text-muted">{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {children}
        </div>
      </div>
    </section>
  );
}
