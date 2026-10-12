import { useLayoutEffect } from "react";

/** 设计预览的媒体遮罩：页面内容中的图片 / 视频 / 画布 / 内联背景图一律换成随机色块，
 *  文字由 styles.css 的 [data-preview] 规则改为占位灰条。
 *  页头 / 页脚 / 幕布 / 门禁 / 预览横幅等界面元素不遮罩，保持可读可点。
 *  用 useLayoutEffect 在首次绘制前替换 src，真实图片因此不会被下载。 */

const BLOCK_COLORS = [
  "#558b91",
  "#8d8253",
  "#6d5f86",
  "#54927d",
  "#8a6a78",
  "#8a6a4f",
  "#54708f",
  "#59548a",
];

const pickColor = () =>
  BLOCK_COLORS[Math.floor(Math.random() * BLOCK_COLORS.length)];

const CHROME =
  "header, footer, [data-curtain], [data-visit-gate], [data-preview-banner], .pointer-dot, .pointer-glass";
const inChrome = (el: Element) => Boolean(el.closest(CHROME));

/** 4×3 的随机色块 SVG，直接当图片源使用（保持原图的 object-cover 裁切行为） */
const blockSrc = (color: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 3'><rect width='4' height='3' fill='${color}'/><rect x='.55' y='.45' width='1.4' height='.12' fill='#fff' opacity='.25'/></svg>`,
  )}`;

const maskImage = (img: HTMLImageElement) => {
  if (inChrome(img)) return;
  // 色块未被 React 改写时跳过（改写后 src 与存档不再一致，或 srcset 复活）
  if (
    img.dataset.pfPreview &&
    img.getAttribute("src") === img.dataset.pfPreview &&
    !img.hasAttribute("srcset")
  ) {
    return;
  }
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
  img
    .closest("picture")
    ?.querySelectorAll("source")
    .forEach((source) => source.removeAttribute("srcset"));
  const masked = blockSrc(pickColor());
  img.dataset.pfPreview = masked;
  img.src = masked;
};

/** video / canvas：停止播放并隐藏，原位覆盖同尺寸色块；内联背景图直接换成色块 */
const maskBox = (el: HTMLElement) => {
  if (inChrome(el)) return;
  if (!(el instanceof HTMLVideoElement) && el.dataset.pfPreview) return;
  // video 的 src 可能被 React 改写回真实地址（画中画/切换）→ 再次遮罩
  if (el instanceof HTMLVideoElement && el.dataset.pfPreview && !el.hasAttribute("src")) {
    return;
  }
  el.dataset.pfPreview = "1";
  if (el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement) {
    if (el instanceof HTMLVideoElement) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    el.style.visibility = "hidden";
  } else {
    el.style.backgroundImage = "none";
    el.style.backgroundColor = pickColor();
    return;
  }
  const parent = el.parentElement;
  if (!parent) return;
  if (getComputedStyle(parent).position === "static") parent.style.position = "relative";
  if (parent.querySelector(":scope > [data-pf-preview-block]")) return;
  const block = document.createElement("div");
  block.setAttribute("data-pf-preview-block", "");
  block.style.cssText = `position:absolute;inset:0;background:${pickColor()};pointer-events:none;border-radius:inherit;`;
  el.insertAdjacentElement("afterend", block);
};

const scan = () => {
  document.querySelectorAll("img").forEach(maskImage);
  document
    .querySelectorAll<HTMLElement>("video, canvas, [style*='background-image']")
    .forEach((el) => {
      if (el instanceof HTMLVideoElement || el instanceof HTMLCanvasElement) maskBox(el);
      else if (el.style.backgroundImage.includes("url(")) maskBox(el);
    });
};

/** 预览激活期间持续扫描：懒加载图片与弹层门户挂载后也会被遮罩 */
export function usePreviewMask(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return;
    // 挂在 body 上让文字灰条规则覆盖到门户节点（弹层），页头页脚由 CSS 排除
    document.body.dataset.preview = "1";
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });
    return () => {
      delete document.body.dataset.preview;
      observer.disconnect();
    };
  }, [active]);
}
