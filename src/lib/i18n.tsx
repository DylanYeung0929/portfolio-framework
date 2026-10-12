import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "zh-Hans" | "zh-Hant" | "en" | "fr";

export const LANG_LABEL: Record<Lang, string> = {
  "zh-Hans": "简体中文",
  "zh-Hant": "繁體中文",
  en: "English",
  fr: "Français",
};

// 语言按钮与面板上的短标记（模板用文字格；想做国旗面板可换回图片）
export const LANG_ABBR: Record<Lang, string> = {
  "zh-Hans": "简",
  "zh-Hant": "繁",
  en: "EN",
  fr: "FR",
};

/** 首页与页脚共用的自我介绍（占位文案，替换成你自己的） */
export const TAGLINE = {
  zh: "一句话自我介绍：你做什么、关心什么、想给访问者留下什么印象。",
  en: "One-line introduction: what you do, what you care about, what visitors should remember.",
  fr: "Présentation en une phrase : ce que vous faites, ce qui vous importe, ce dont on se souviendra.",
} as const;

/** 站点名（页签标题用） */
export const SITE_TITLE = { zh: "作品集框架", en: "Portfolio Framework" } as const;

const LANG_KEY = "pf-lang";

const readLang = (): Lang => {
  if (typeof window === "undefined") return "zh-Hant";
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "zh-Hans" || saved === "zh-Hant" || saved === "en" || saved === "fr") return saved;
    if (saved === "zh") return "zh-Hant";
    return "zh-Hant";
  } catch {
    return "zh-Hant";
  }
};

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** 正文文案：汉语两档共用同一文本（简繁仅作用于标题与导航层），法语缺省回退英文 */
  pick: <T>(zh: T, en: T, fr?: T) => T;
  /** 标题/导航层：简体、繁体分别给文本，法语缺省回退英文 */
  pickT: <T>(hans: T, hant: T, en: T, fr?: T) => T;
}

const I18nContext = createContext<I18nValue>({
  lang: "zh-Hant",
  setLang: () => {},
  pick: (zh) => zh,
  pickT: (hans) => hans,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = lang === "zh-Hans" || lang === "zh-Hant" ? SITE_TITLE.zh : SITE_TITLE.en;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* 无痕模式下忽略 */
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);
  const pick = useCallback(
    <T,>(zh: T, en: T, fr?: T) => (lang === "zh-Hans" || lang === "zh-Hant" ? zh : lang === "fr" ? ((fr ?? en) as T) : en),
    [lang],
  );
  const pickT = useCallback(
    <T,>(hans: T, hant: T, en: T, fr?: T) =>
      lang === "zh-Hans" ? hans : lang === "zh-Hant" ? hant : lang === "fr" ? ((fr ?? en) as T) : en,
    [lang],
  );

  const value = useMemo(() => ({ lang, setLang, pick, pickT }), [lang, setLang, pick, pickT]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
