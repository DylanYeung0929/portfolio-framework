import type { Route } from "../types";

/**
 * 各路由的章节名：[简中, 繁中, EN, FR]。
 * 同一份文本用于两处：章节页 hero 的 chapter 行，以及章节加载幕布的首行 kicker。
 * 想让幕布首行显示别的（如章节副题），改这里即可。
 */
export const CHAPTER_LABELS: Record<Route, [string, string, string, string]> = {
  home: ["序章 · 首页", "序章 · 首頁", "Prologue · Home", "Prologue · Accueil"],
  gallery: ["第一章 · 画廊", "第一章 · 畫廊", "Chapter One · Gallery", "Chapitre un · Galerie"],
  photography: ["第二章 · 摄影作品", "第二章 · 攝影作品", "Chapter II · Photography", "Chapitre II · Photographie"],
  projects: ["第三章 · 项目经历", "第三章 · 項目經歷", "Chapter 3 · Projects", "Chapitre 3 · Projets"],
  research: ["第四章 · 科研经历", "第四章 · 科研經歷", "Chapter 4 · Research", "Chapitre 4 · Recherche"],
  artworks: ["第五章 · 艺术作品", "第五章 · 藝術作品", "Chapter Five · Artworks", "Chapitre cinq · Œuvres"],
  design: ["第六章 · 视觉设计", "第六章 · 視覺設計", "Chapter Six · Visual Design", "Chapitre six · Design visuel"],
};
