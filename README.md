# Portfolio Framework

可直接运行的暗色编辑部风个人作品集框架：Vite + React + TypeScript + Tailwind + Cloudflare Pages Functions（KV）。
内容全部为占位文本，核心机制完整保留——clone 下来即可跑，把占位内容换成你自己的就能上线。

## 设计理念

- **编辑部排版**：衬线大标题（Kalnia）+ 无衬线正文（Josefin Sans）+ 手写体点缀（Pacifico），低饱和强调色，深色为默认主题。
- **章节叙事**：全站按「序章 + 六章」组织，翻页顺序固定，←/→ 键与页头箭头全站翻页。
- **等待也是体验**：进入章节先落一块与首访一致的幕布（章节名 + 笔迹描摹），内容与图片真正就绪后才揭开，避免白屏与图片逐张跳出。
- **克制的内容保护**：只有需要保护的章节（默认「项目经历」「科研经历」）挂访客码，其余全部自由访问；凭证每半小时到期。
- **材质统一**：所有按钮与导航共用一套液态玻璃材质（Chromium 真折射，其余浏览器自动降级为加强磨砂）。

## 快速开始

```bash
npm install

# 纯前端开发（无 Worker，/api 请求静默回退）
npm run dev

# 需要 API（策展/门禁/订阅）：先构建再用 wrangler 托管 dist，另开终端跑 vite
npm run build
npx wrangler pages dev dist --port 8788 --binding GATE_CODE=yourcode --binding ADMIN_PASSWORD=yourpass
npm run dev   # /api 会代理到 127.0.0.1:8788

# 生产部署（先创建 KV 并把 id 填进 wrangler.jsonc）
npx wrangler kv namespace create KV
npm run deploy
npx wrangler pages secret put GATE_CODE       # 访客码（不设 = 门禁关闭）
npx wrangler pages secret put ADMIN_PASSWORD  # 后台口令
```

## 目录结构

```
src/
  App.tsx                 路由、首访幕布、章节幕布 + 就绪探测、门禁接力
  main.tsx                入口（I18nProvider 包裹）
  styles.css              字体面、主题令牌、液态玻璃、光标、环境色场
  types.ts                Route / ThemeColor
  assets/                 占位素材（换自己的图）
  components/
    Curtain.tsx           章节/首访幕布（笔迹描摹 + 上滑揭示）
    GateScreen.tsx        访客码门禁（凭证读写也在这里）
    AppHeader.tsx         页头：邮箱复制、翻页、主题、语言面板、全屏导航
    SiteFooter.tsx        页脚：分组导航、联系方式、订阅表单
    SectionHero.tsx       章节 hero（GSAP 进场）
    PointerExperience.tsx 自定义光标（圆点 + 玻璃圈 + 标签）
    LiquidGlassButton.tsx 液态玻璃按钮（自带光斑跟随）
    BackToTop.tsx         环形进度的回到顶部
    AmbientColorField.tsx 滚动联动的环境色场
  hooks/
    useLiquidGlass.ts     hyalite 折射接管与降级
    useSmoothScroll.ts    Lenis + GSAP ScrollTrigger（getLenis 供外部调用）
    useTheme.ts           pf-theme 主题（首帧前由 index.html 内联脚本定色）
    useArrowNav.ts        ←/→ 翻页
  lib/
    brand.ts              幕布笔迹占位路径（换自己笔迹的地方）
    chapters.ts           章节名（四语，hero 与幕布共用）
    i18n.tsx              四语言上下文：pick（正文）/ pickT（标题导航）
    nav.ts                翻页顺序与导航项
    themes.ts             六章节强调色
    curation.ts           策展读写 + useImgUrl（槽位覆盖图）
    cn.ts                 clsx + tailwind-merge
  pages/
    HomePage.tsx          整屏 hero + 六章节目录
    SectionPage.tsx       六章节通用页（hero + 内容块 + 上下节）
  worker/index.ts         Pages Functions：策展 / 门禁 / 记录 / 订阅 / 登录
public/
  fonts/                  自托管字体子集
  _headers                静态资源长缓存
```

## 机制详解

### 1. 章节加载幕布（App.tsx）

进入任一章节时若已有访客凭证（或该章不设门禁），先渲染 `<Curtain hold>`：首行是章节名（lib/chapters.ts），笔迹描到 97% 悬停等待。就绪探测顺序：

1. `[data-route-view="<route>"]` 出现且不再含 `[data-route-fallback]`（lazy 模块已挂载）；
2. `document.fonts.ready`（字体就绪）；
3. 两遍扫描视口内图片：先按 `loading=lazy` 与视口位置过滤，**再** `img.decode()`（顺序反了会强载全页懒图），两遍间隔 140ms 捕获迟挂载图；
4. 至少停留 1.3s（进度条走满），最多 9s 兜底强揭（个别图片卡死不至于永久遮挡）。

按住期间 Lenis 被暂停，幕布后面不会滚动。`prefers-reduced-motion` 下全程不拦。

### 2. 首访幕布与笔迹描摹

首次进入 `#home`（同一 session）时自滑出一块幕布，`pathLength` 逐笔「写」出笔迹。笔迹数据在 `lib/brand.ts` —— 换成自己签名的做法见该文件注释（手写体 + opentype.js 取 d 值）。

### 3. 访客码门禁（GateScreen.tsx + worker）

- 只有 `LOCKED_ROUTES`（默认 projects / research）受保护；从任何入口导航到这两页都会先落门禁屏。
- 通过后写 `localStorage["pf-gate"] = 时间戳`，半小时内免输入；驻留页面到点自动回门禁；`?` 章节内详情 hash 不触发。
- 服务端：SHA-256 定长比较；同一 IP 连续失败 20 次锁 15 分钟（正确码也一并挡下，与后台登录同策略）；GET `/api/gate` 返回 `required`，接口异常时前端 fail-closed（宁可拦下）。
- 每次输入（成功/失败）写一条 KV 记录：时间 / IP（CF-Connecting-IP）/ 设备 UA，保留 90 天；`GET /api/gate/logs`（需会话）按时间倒序返回最近 200 条——可据此自建后台「访客码记录」页。

### 4. 液态玻璃（useLiquidGlass.ts + hyalite）

Chromium 上用 [hyalite](https://github.com/VII-Cae/hyalite--liquid-glass) 给 `.liquid-button` / `.glass-control` 与光标玻璃圈做真实折射（`data-glass="refract"`）；WebKit / Firefox 或 reduced-transparency / contrast 下自动退回 CSS 磨砂（发丝线 + 内高光），外观统一。

### 5. 四语言（lib/i18n.tsx）

`zh-Hans / zh-Hant / en / fr` 四档；`pick(zh, en, fr?)` 给正文（简繁共用），`pickT(hans, hant, en, fr?)` 给标题与导航（简繁分开）；法语缺省回退英文。语言面板是 2×2 玻璃格。

### 6. 平滑滚动与翻页

Lenis 驱动滚动并接管 GSAP ScrollTrigger 的更新节拍；`getLenis()` 供回到顶部等处调用。页头箭头与 ←/→ 键按 `navOrder` 循环翻页。

### 7. 光标体验（PointerExperience.tsx）

- `data-cursor="LABEL"`：悬停元素时玻璃圈张开显示标签，`button/a/input` 等自动映射为 OPEN/VIEW/SELECT/DRAG（法语界面自动换法语词）。
- `data-cursor-cycle="A|B|C"`：悬停时按 520ms 轮换标签（适合展示多语言之类的彩蛋）。
- 仅精确指针 + 非 reduced-motion 环境启用。

### 8. 策展与订阅 API（worker/index.ts + lib/curation.ts）

- `GET /api/curation` 公开读；`PUT /api/curation` 需会话（登录后拿 HttpOnly Cookie）——不重新部署即可换首页/章节的图。
- 前端用 `useImgUrl(slots?.["some.slot"], fallback)` 从槽位取覆盖图；槽位 id 自定。
- `POST /api/subscribe` 邮箱订阅（限流 + 去重），每邮箱一个 KV 键，按 `pf-subscriber:` 前缀可导出。
- 凭证 / 限流 / 会话全部按 `pf-` 前缀分组存在同一个 KV。

## 自定义清单

| 想改什么 | 去哪里 |
| --- | --- |
| 名字、标语、站点标题 | `lib/i18n.tsx`（TAGLINE/SITE_TITLE）、`HomePage.tsx`、`Curtain.tsx`、`GateScreen.tsx` |
| 邮箱与社交账号 | `components/AppHeader.tsx`（EMAIL）、`components/SiteFooter.tsx`（CONTACTS） |
| 章节名与数量 | `lib/nav.ts` + `lib/chapters.ts` + `lib/themes.ts` + `types.ts`（新增路由四处对齐） |
| 受保护的章节 | `App.tsx` 的 `LOCKED_ROUTES` |
| 笔迹 | `lib/brand.ts` |
| 强调色 | `tailwind.config.js` 的 `hues` 与 `lib/themes.ts` |
| 字体 | `public/fonts/` 与 `styles.css` 的 `@font-face` |
| 图片 | 放 `src/assets/`，或经策展 API 用槽位覆盖 |

## 依赖与许可

- 运行时依赖：React、motion、GSAP（含 @gsap/react）、Lenis、lucide-react、clsx、tailwind-merge。注意 GSAP 为自定义许可（商用需看其条款）。
- [hyalite--liquid-glass](https://github.com/VII-Cae/hyalite--liquid-glass) 经 GitHub tarball 引入（package.json 里锁定了具体 commit）。
- 页脚社交图标字形来自 Simple Icons（CC0）。
- 字体 Kalnia / Josefin Sans / Pacifico 均为 Google Fonts（OFL），子集已随仓库自托管。
- 上线前请自行核对所用依赖的许可证是否满足你的使用场景。
