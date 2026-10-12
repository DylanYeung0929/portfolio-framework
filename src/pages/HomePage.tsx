import { useI18n } from "../lib/i18n";
import { navItems } from "../lib/nav";
import { themes } from "../lib/themes";
import type { Route } from "../types";
import { LiquidGlassButton } from "../components/LiquidGlassButton";
import { useCuration, useImgUrl } from "../lib/curation";
import portraitFallback from "../assets/portrait.svg";

/** 首页：整屏 deck（不滚动），姓名 + 标语 + 六章节目录。 */
export function HomePage({ navigate }: { navigate: (route: Route) => void }) {
  const { pick, pickT } = useI18n();
  const { slots } = useCuration();
  const portrait = useImgUrl(slots?.["home.portrait"], portraitFallback);

  return (
    <section className="relative grid min-h-dvh place-items-center overflow-hidden px-5 pb-16 pt-24 lg:px-8">
      <div className="mx-auto grid w-full max-w-[1600px] items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
        <div className="max-w-[46rem]">
          <p className="text-[11px] tracking-[.34em] text-muted">PORTFOLIO FRAMEWORK · 2026</p>
          <h1 className="display-en mt-6 text-[clamp(2.8rem,7vw,5.5rem)] font-medium leading-[.96] text-fg">
            {pickT("你的名字", "你的名字", "Your Name", "Votre nom")}
            <span className="accent-dot">.</span>
          </h1>
          <p className="mt-3 font-serif text-[clamp(1.3rem,3vw,2rem)] leading-[1.2] text-fg/70">
            {pick("用作品讲清楚你是谁", "Let the work say who you are", "Laissez l'œuvre dire qui vous êtes")}
          </p>
          <p className="mt-5 max-w-[44ch] text-pretty text-[15px] leading-[1.8] text-fg/60">
            {pick(
              "这是一个可直接运行的暗色编辑风作品集框架：章节加载幕布、液态玻璃控件、四语切换与访客码门禁都已就位，内容换成你自己的即可。",
              "A runnable dark-editorial portfolio framework: chapter curtains, liquid-glass controls, four languages and a guest-code gate are all wired up — just replace the content with your own.",
              "Un framework de portfolio sombre et éditorial, prêt à l'emploi : rideaux de chargement, verre liquide, quatre langues et code invité déjà en place — remplacez simplement le contenu.",
            )}
          </p>
          <div className="mt-8 flex flex-wrap gap-3" data-cursor={pick("进入", "OPEN", "OUVRIR")}>
            {navItems.map((item) => (
              <LiquidGlassButton
                key={item.route}
                onClick={() => navigate(item.route)}
                className="rounded-full px-4 py-2 text-[13px] tracking-[.04em]"
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: themes[item.route].gradFrom }}
                  aria-hidden="true"
                />
                {pickT(item.zhHans, item.zh, item.en, item.fr)}
              </LiquidGlassButton>
            ))}
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-12 gap-y-5 border-t border-line/12 pt-5">
            <li className="flex items-baseline gap-2.5">
              <strong className="display-en text-3xl font-medium text-fg">07</strong>
              <span className="text-[12.5px] tracking-[.12em] text-muted">{pick("章节", "SECTIONS", "SECTIONS")}</span>
            </li>
            <li className="flex items-baseline gap-2.5">
              <strong className="display-en text-3xl font-medium text-fg">04</strong>
              <span className="text-[12.5px] tracking-[.12em] text-muted">{pick("语言", "LANGUAGES", "LANGUES")}</span>
            </li>
            <li className="flex items-baseline gap-2.5">
              <strong className="display-en text-3xl font-medium text-fg">02</strong>
              <span className="text-[12.5px] tracking-[.12em] text-muted">{pick("受控章节", "GATED SECTIONS", "SECTIONS PROTÉGÉES")}</span>
            </li>
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-[26rem]">
          <img
            src={portrait}
            alt=""
            draggable={false}
            data-cursor-cycle={`${pick("我", "ME", "MOI")}|${pick("你好", "HELLO", "SALUT")}|${pick("作品", "WORK", "ŒUVRE")}`}
            className="w-full rounded-2xl border border-line/12 object-cover"
          />
          <span className="pointer-events-none absolute -bottom-3 left-4 rounded-full border border-line/15 bg-bg/80 px-3 py-1 text-[10px] tracking-[.22em] text-muted backdrop-blur-md">
            {pick("悬停试试光标", "HOVER THE CURSOR", "SURVOLEZ LE CURSEUR")}
          </span>
        </div>
      </div>
    </section>
  );
}
