import type { ThemeColor } from "../types";

// 六个章节的强调色：深色下用 300/400 亮阶，浅色下用 600/700 暗阶，只作圆点与小标题点缀。
export const themes = {
  gallery: {
    name: "青蓝",
    text: "text-accent-cyan-700 dark:text-accent-cyan-300",
    softBg: "bg-accent-cyan-100/70 dark:bg-accent-cyan-400/10",
    border: "border-accent-cyan-200 dark:border-accent-cyan-400/25",
    gradFrom: "#558b91",
    gradTo: "#54708f",
  },
  photography: {
    name: "琥珀",
    text: "text-accent-amber-700 dark:text-accent-amber-300",
    softBg: "bg-accent-amber-100/70 dark:bg-accent-amber-400/10",
    border: "border-accent-amber-200 dark:border-accent-amber-400/25",
    gradFrom: "#8d8253",
    gradTo: "#8a6a4f",
  },
  projects: {
    name: "紫罗兰",
    text: "text-accent-violet-700 dark:text-accent-violet-300",
    softBg: "bg-accent-violet-100/70 dark:bg-accent-violet-400/10",
    border: "border-accent-violet-200 dark:border-accent-violet-400/25",
    gradFrom: "#6d5f86",
    gradTo: "#59548a",
  },
  research: {
    name: "翡翠绿",
    text: "text-accent-emerald-700 dark:text-accent-emerald-300",
    softBg: "bg-accent-emerald-100/70 dark:bg-accent-emerald-400/10",
    border: "border-accent-emerald-200 dark:border-accent-emerald-400/25",
    gradFrom: "#54927d",
    gradTo: "#549290",
  },
  artworks: {
    name: "品红",
    text: "text-accent-pink-700 dark:text-accent-pink-300",
    softBg: "bg-accent-pink-100/70 dark:bg-accent-pink-400/10",
    border: "border-accent-pink-200 dark:border-accent-pink-400/25",
    gradFrom: "#8a6a78",
    gradTo: "#8a6a6a",
  },
  design: {
    name: "橙黄",
    text: "text-accent-orange-700 dark:text-accent-orange-300",
    softBg: "bg-accent-orange-100/70 dark:bg-accent-orange-400/10",
    border: "border-accent-orange-200 dark:border-accent-orange-400/25",
    gradFrom: "#8a6a4f",
    gradTo: "#8a7a4a",
  },
} as const satisfies Record<string, ThemeColor>;
