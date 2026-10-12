import { SectionHero } from "../components/SectionHero";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { useI18n } from "../lib/i18n";
import { CHAPTER_LABELS } from "../lib/chapters";
import { navItems, stepRoute, type SectionRoute } from "../lib/nav";
import type { Route } from "../types";

type Meta = {
  eyebrow: string;
  titleEn: string;
  titleZhHans: string;
  titleZh: string;
  titleFr: string;
  /** [简中/繁中共用, EN, FR] */
  desc: [string, string, string];
  stats: [string, string][];
};

/** 六个章节的标题与占位文案：换成你自己的内容，hero 版式保持不变。 */
const SECTION_META: Record<SectionRoute, Meta> = {
  gallery: {
    eyebrow: "GALLERY",
    titleEn: "Gallery",
    titleZhHans: "画廊",
    titleZh: "畫廊",
    titleFr: "Galerie",
    desc: [
      "这里放你的代表作总览：挑最能代表水平的几件，配上克制的说明文字。",
      "A curated overview of your strongest work — a few pieces with restrained captions.",
      "Un aperçu choisi de vos meilleures pièces, avec des légendes sobres.",
    ],
    stats: [["12", "ITEMS"], ["2024—2026", "YEARS"]],
  },
  photography: {
    eyebrow: "PHOTOGRAPHY",
    titleEn: "Photography",
    titleZhHans: "摄影作品",
    titleZh: "攝影作品",
    titleFr: "Photographie",
    desc: [
      "摄影章节的占位文案：系列、地点、时间线都可以放在这里，图片用 useImgUrl 接策展槽位。",
      "Placeholder copy for a photography section: series, places and timelines live here; wire images through useImgUrl curation slots.",
      "Texte de remplacement pour la photographie : séries, lieux et chronologies ; reliez les images aux slots de curation via useImgUrl.",
    ],
    stats: [["156", "SHOTS"], ["26", "CITIES"]],
  },
  projects: {
    eyebrow: "PROJECTS",
    titleEn: "Projects",
    titleZhHans: "项目经历",
    titleZh: "項目經歷",
    titleFr: "Projets",
    desc: [
      "项目章节默认受访客码保护（可在 App.tsx 的 LOCKED_ROUTES 调整）：从任何入口跳进来都会先被拦下。",
      "This section is guest-code protected by default (tune LOCKED_ROUTES in App.tsx): any route into it hits the gate first.",
      "Section protégée par code invité par défaut (réglable dans LOCKED_ROUTES, App.tsx) : toute entrée passe d'abord par la porte.",
    ],
    stats: [["08", "PROJECTS"], ["03", "AWARDS"]],
  },
  research: {
    eyebrow: "RESEARCH",
    titleEn: "Research",
    titleZhHans: "科研经历",
    titleZh: "科研經歷",
    titleFr: "Recherche",
    desc: [
      "科研章节同样默认受访客码保护；论文、课题与实验记录按你的结构铺开。",
      "Research is gated by default as well; lay out papers, topics and lab notes in your own structure.",
      "La recherche est également protégée ; organisez publications, sujets et notes de laboratoire.",
    ],
    stats: [["04", "PAPERS"], ["02", "TOPICS"]],
  },
  artworks: {
    eyebrow: "ARTWORKS",
    titleEn: "Artworks",
    titleZhHans: "艺术作品",
    titleZh: "藝術作品",
    titleFr: "Œuvres",
    desc: [
      "艺术创作章节的占位文案：系列简介 + 作品网格，版式自由发挥。",
      "Placeholder copy for artworks: a series intro plus a grid of pieces — the layout is yours.",
      "Texte de remplacement pour les œuvres : une intro de série et une grille de pièces.",
    ],
    stats: [["23", "PIECES"], ["05", "SERIES"]],
  },
  design: {
    eyebrow: "VISUAL DESIGN",
    titleEn: "Visual Design",
    titleZhHans: "视觉设计",
    titleZh: "視覺設計",
    titleFr: "Design Visuel",
    desc: [
      "视觉设计章节的占位文案：品牌、界面与动效方案，附上过程与成品对比。",
      "Placeholder copy for visual design: brand, interface and motion work, with before-and-after process notes.",
      "Texte de remplacement pour le design visuel : marque, interfaces et motion, avec les étapes de conception.",
    ],
    stats: [["09", "CASES"], ["04", "BRANDS"]],
  },
};

/** 六个章节共用的版式：hero + 占位内容块 + 上一节/下一节。 */
export function SectionPage({ route, navigate }: { route: SectionRoute; navigate: (route: Route) => void }) {
  const { pick, pickT } = useI18n();
  const meta = SECTION_META[route];
  const index = navItems.findIndex((item) => item.route === route) + 1;

  return (
    <>
      <SectionHero
        chapter={pickT(...CHAPTER_LABELS[route])}
        eyebrow={meta.eyebrow}
        titleEn={meta.titleEn}
        titleZh={meta.titleZh}
        titleZhHans={meta.titleZhHans}
        titleFr={meta.titleFr}
        desc={pick(meta.desc[0], meta.desc[1], meta.desc[2])}
        theme={route}
        stats={meta.stats}
      />
      <section className="px-5 pb-24 lg:px-8">
        <div className="mx-auto max-w-[1600px]">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="grid min-h-[11rem] place-items-center rounded-xl border border-line/10 bg-panel/40 text-[11px] tracking-[.3em] text-muted/60"
              >
                {pick(`内容块 ${n}`, `CONTENT ${n}`, `BLOC ${n}`)}
              </div>
            ))}
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line/10 pt-8">
            <span className="text-[11px] tracking-[.3em] text-muted">
              {pickT(`第 ${index} 章 / 共 6 章`, `第 ${index} 章 / 共 6 章`, `SECTION ${index} / 6`, `SECTION ${index} / 6`)}
            </span>
            <div className="flex gap-3">
              <LiquidGlassButton arrow className="px-5 py-2.5 text-[13px]" onClick={() => navigate(stepRoute(route, -1))}>
                {pickT("上一节", "上一節", "Previous", "Précédent")}
              </LiquidGlassButton>
              <LiquidGlassButton arrow className="px-5 py-2.5 text-[13px]" onClick={() => navigate(stepRoute(route, 1))}>
                {pickT("下一节", "下一節", "Next", "Suivant")}
              </LiquidGlassButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
