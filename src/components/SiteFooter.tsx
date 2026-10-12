import { useEffect, useState, type ReactNode } from "react";
import { Check, Mail } from "lucide-react";
import { TAGLINE, useI18n } from "../lib/i18n";
import { getLenis } from "../hooks/useSmoothScroll";
import type { Route } from "../types";

declare const __BUILD_MONTH__: string;

const groups = [
  {
    title: ["EXPLORE", "EXPLORE", "EXPLORER"],
    links: [
      ["首页", "首頁", "Home", "Accueil", "home"],
      ["画廊", "畫廊", "Gallery", "Galerie", "gallery"],
      ["摄影作品", "攝影作品", "Photography", "Photographie", "photography"],
      ["艺术作品", "藝術作品", "Artworks", "Œuvres", "artworks"],
    ],
  },
  {
    title: ["SYSTEM", "SYSTEM", "SYSTÈME"],
    links: [
      ["项目经历", "項目經歷", "Projects", "Projets", "projects"],
      ["科研经历", "科研經歷", "Research", "Recherche", "research"],
      ["视觉设计", "視覺設計", "Visual Design", "Design visuel", "design"],
    ],
  },
] as const;

// 品牌字形取自 Simple Icons（CC0），随字色着色
const GITHUB_PATH =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";
const INSTAGRAM_PATH =
  "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077";
const X_PATH =
  "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z";

const glyph = (d: string) => (
  <svg viewBox="0 0 24 24" className="size-3.5 shrink-0 fill-current" aria-hidden="true">
    <path d={d} />
  </svg>
);

// 占位联系方式：替换成你自己的邮箱与账号
const CONTACTS: Array<{ icon: ReactNode; value: string; action: "copy" | "open"; href?: string }> = [
  { icon: <Mail className="size-3.5 shrink-0" />, value: "you@example.com", action: "copy" },
  { icon: glyph(GITHUB_PATH), value: "your-github", action: "open", href: "https://github.com/" },
  { icon: glyph(INSTAGRAM_PATH), value: "your-instagram", action: "open", href: "https://www.instagram.com/" },
  { icon: glyph(X_PATH), value: "your-handle", action: "open", href: "https://x.com/" },
];

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 剪贴板 API 在非安全上下文/无权限时不可用，退回选区复制
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:-100px;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

function ContactRow({ item }: { item: (typeof CONTACTS)[number] }) {
  const { pick } = useI18n();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const cls =
    "group flex w-full items-center gap-2.5 py-1.5 text-left text-[13px] text-fg/70 transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500";
  const body = (
    <>
      <span className="text-fg/45 transition-colors group-hover:text-fg/70">{item.icon}</span>
      <span className="truncate">{copied ? pick("已复制到剪贴板", "Copied to clipboard", "Copié dans le presse-papiers") : item.value}</span>
      <span className={`ml-auto shrink-0 text-[10px] tracking-[.12em] transition-colors ${copied ? "text-accent-cyan-500" : "text-fg/35 group-hover:text-fg/60"}`}>
        {copied ? <Check className="size-3.5" aria-hidden="true" /> : pick(item.action === "copy" ? "复制" : "前往", item.action === "copy" ? "Copy" : "Open", item.action === "copy" ? "Copier" : "Ouvrir")}
      </span>
    </>
  );
  if (item.href)
    return (
      <a href={item.href} target="_blank" rel="noreferrer noopener" className={cls} aria-label={pick(`${item.value}（新标签打开）`, `${item.value} (opens in a new tab)`, `${item.value} (ouvre dans un nouvel onglet)`)}>
        {body}
      </a>
    );
  return (
    <button type="button" className={cls} onClick={() => { void writeClipboard(item.value); setCopied(true); }} aria-label={pick(`复制 ${item.value}`, `Copy ${item.value}`, `Copier ${item.value}`)}>
      {body}
    </button>
  );
}

type SubscribeState = { kind: "idle" } | { kind: "sending" } | { kind: "done"; already: boolean } | { kind: "error"; message: string };

function SubscribeForm() {
  const { pick } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubscribeState>({ kind: "idle" });
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (state.kind === "sending") return;
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
      setState({ kind: "error", message: pick("邮箱格式不正确", "Please enter a valid email address", "Veuillez saisir une adresse e-mail valide") });
      return;
    }
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; already?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setState({
          kind: "error",
          message: pick(data.error ?? "提交失败，请稍后再试", "Submission failed, please try again later", "Échec de l'envoi, veuillez réessayer"),
        });
        return;
      }
      setState({ kind: "done", already: Boolean(data.already) });
      setEmail("");
    } catch {
      setState({ kind: "error", message: pick("网络异常，请稍后再试", "Network error, please try again later", "Erreur réseau, veuillez réessayer") });
    }
  };
  const sending = state.kind === "sending";
  return (
    <form onSubmit={submit} noValidate className="w-full max-w-md">
      <div className="flex items-center gap-2">
        <input
          type="email"
          name="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state.kind === "error" || state.kind === "done") setState({ kind: "idle" });
          }}
          placeholder="your@email.com"
          aria-label={pick("订阅邮箱", "Subscription email", "Adresse e-mail d'abonnement")}
          className="min-w-0 flex-1 rounded-full border border-line/15 bg-transparent px-4 py-2 text-[13px] text-fg transition-colors placeholder:text-fg/30 hover:border-line/30 focus:border-line/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500"
        />
        <button
          type="submit"
          disabled={sending}
          className="shrink-0 rounded-full border border-line/15 px-4 py-2 text-[11px] tracking-[.12em] text-fg/70 transition-colors hover:border-line/40 hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500 disabled:opacity-50"
        >
          {pick(sending ? "提交中" : "订阅", sending ? "Sending" : "Subscribe", sending ? "Envoi…" : "S'abonner")}
        </button>
      </div>
      <p className="mt-2 min-h-4 text-[11px] tracking-[.06em]" aria-live="polite">
        {state.kind === "done" && (
          <span className="text-accent-cyan-500">
            {state.already
              ? pick("这个邮箱已经订阅过了", "This email is already subscribed", "Cet e-mail est déjà abonné")
              : pick("订阅成功，新作品上线时通知你", "Subscribed — you'll hear about new work first", "Abonnement confirmé — vous serez informé des nouveautés")}
          </span>
        )}
        {state.kind === "error" && <span className="text-fg/60">{state.message}</span>}
      </p>
    </form>
  );
}

export function SiteFooter({ navigate }: { navigate: (route: Route) => void }) {
  const { pick, pickT } = useI18n();
  return (
    <footer className="border-t border-line/10 bg-panel/50 px-5 py-16 text-fg lg:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[1.4fr_.85fr_.85fr_1.3fr] md:grid-cols-2">
        <div>
          <span className="font-serif text-3xl font-medium tracking-tight">Portfolio<span className="text-muted">.</span></span>
          <p className="mt-6 max-w-sm text-[15px] leading-[1.8] text-muted">{pick(TAGLINE.zh, TAGLINE.en, TAGLINE.fr)}</p>
        </div>
        {groups.map((group) => <nav key={group.links[0][4]} aria-label={pick(group.title[0], group.title[1], group.title[2])}><h2 className="text-xs font-semibold tracking-[.16em] text-muted/70">{pick(group.title[0], group.title[1], group.title[2])}</h2><ul className="mt-5 space-y-3">{group.links.map(([hans, hant, en, fr, route]) => <li key={route}><button className="text-left text-base font-semibold text-fg/75 transition-colors hover:text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan-500" onClick={() => navigate(route as Route)}>{pickT(hans, hant, en, fr)}</button></li>)}</ul></nav>)}
        <div>
          <h2 className="text-xs font-semibold tracking-[.16em] text-muted/70">{pickT("CONTACT · 联络", "CONTACT · 聯絡", "CONTACT", "CONTACT")}</h2>
          <ul className="mt-4 -ml-1 max-w-sm">
            {CONTACTS.map((item) => <li key={item.value}><ContactRow item={item} /></li>)}
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-14 max-w-[1600px] border-t border-line/10 pt-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xs font-semibold tracking-[.16em] text-muted/70">{pickT("NEWSLETTER · 订阅更新", "NEWSLETTER · 訂閱更新", "NEWSLETTER", "NEWSLETTER")}</h2>
            <p className="mt-2 text-[13px] text-muted/70">{pick("留下邮箱，新作品与新文章上线时通知你。", "Leave your email and I'll let you know when new work goes live.", "Laissez votre e-mail et je vous préviendrai dès la mise en ligne de nouveaux travaux.")}</p>
          </div>
          <SubscribeForm />
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-[1600px] border-t border-line/10 pt-6 text-[11px] leading-[1.9] tracking-[.08em] text-muted/70">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Your Name · All rights reserved</p>
          <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 pr-12 lg:pr-16">
            <button onClick={() => navigate("home")} className="transition-colors hover:text-fg">{pickT("首页", "首頁", "HOME", "ACCUEIL")}</button>
            <button onClick={() => getLenis()?.scrollTo(0)} className="transition-colors hover:text-fg">{pickT("顶部", "頂部", "TOP", "HAUT")}</button>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted/60">{pick("本站设计、文字与图像内容未经许可不得转载或用于商业用途。", "All design, text and imagery on this site may not be reproduced or used commercially without permission.", "Tout design, texte et image de ce site ne peut être reproduit ni exploité commercialement sans autorisation.")}</p>
          <p className="pr-12 text-muted/60 lg:pr-16">LAST UPDATED {__BUILD_MONTH__}</p>
        </div>
      </div>
    </footer>
  );
}
