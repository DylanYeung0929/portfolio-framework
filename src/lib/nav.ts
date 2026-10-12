import type { Route } from "../types";

export type SectionRoute = Exclude<Route, "home">;

export type NavItem = {
  route: SectionRoute;
  en: string;
  zh: string;
  zhHans: string;
  fr: string;
  note: string;
  noteEn: string;
  noteFr: string;
};

/** 全站翻页顺序：首页 → 六个章节循环。 */
export const navOrder: Route[] = [
  "home",
  "gallery",
  "photography",
  "projects",
  "research",
  "artworks",
  "design",
];

export const navItems: NavItem[] = [
  { route: "gallery", en: "GALLERY", zhHans: "画廊", zh: "畫廊", fr: "GALERIE", note: "作品一览", noteEn: "A view of the work", noteFr: "Un aperçu de l'œuvre" },
  { route: "photography", en: "PHOTOGRAPHY", zhHans: "摄影作品", zh: "攝影作品", fr: "PHOTOGRAPHIE", note: "光影与瞬间", noteEn: "Light and moments", noteFr: "Lumière et instants" },
  { route: "projects", en: "PROJECTS", zhHans: "项目经历", zh: "項目經歷", fr: "PROJETS", note: "动手做的东西", noteEn: "Things built by hand", noteFr: "Choses construites à la main" },
  { route: "research", en: "RESEARCH", zhHans: "科研经历", zh: "科研經歷", fr: "RECHERCHE", note: "课题与探索", noteEn: "Topics and exploration", noteFr: "Sujets et exploration" },
  { route: "artworks", en: "ARTWORKS", zhHans: "艺术作品", zh: "藝術作品", fr: "ŒUVRES", note: "创作与表达", noteEn: "Creation and expression", noteFr: "Création et expression" },
  { route: "design", en: "VISUAL DESIGN", zhHans: "视觉设计", zh: "視覺設計", fr: "DESIGN VISUEL", note: "品牌与界面", noteEn: "Brand and interface", noteFr: "Marque et interfaces" },
];

export function stepRoute(route: Route, delta: 1 | -1): Route {
  const index = navOrder.indexOf(route);
  if (index === -1) return "home";
  return navOrder[(index + delta + navOrder.length) % navOrder.length];
}
