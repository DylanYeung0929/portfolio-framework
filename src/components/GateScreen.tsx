import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { useI18n } from "../lib/i18n";
import { PLACEHOLDER_SIG } from "../lib/brand";

const GATE_KEY = "pf-gate";

/** 访客码凭证有效期：半小时 */
export const GATE_TTL_MS = 30 * 60 * 1000;

/** 本设备上次通过访客码的时间戳（ms）；DEV 返回 Infinity 表示永久免码 */
export const readGateAt = (): number => {
  if (import.meta.env.DEV) return Number.POSITIVE_INFINITY;
  try {
    const raw = localStorage.getItem(GATE_KEY);
    const at = raw ? Number(raw) : NaN;
    return Number.isFinite(at) && at > 0 ? at : 0;
  } catch {
    return 0;
  }
};

/** 凭证是否仍在半小时有效期内 */
export const readGate = () => {
  const at = readGateAt();
  if (!Number.isFinite(at)) return true;
  return at > 0 && Date.now() - at < GATE_TTL_MS;
};

export const writeGate = () => {
  try {
    localStorage.setItem(GATE_KEY, String(Date.now()));
  } catch {
    /* 无痕模式下忽略 */
  }
};

/** 访客门禁：受控章节（App.tsx 的 LOCKED_ROUTES）凭访客码进入，其余页面自由访问 */
export function GateScreen({ onPass }: { onPass: () => void }) {
  const { pickT } = useI18n();
  const sig = PLACEHOLDER_SIG;
  const [phase, setPhase] = useState<"checking" | "locked" | "busy" | "leaving">("checking");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pass = useCallback(() => {
    writeGate();
    setPhase("leaving");
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/gate")
      .then((res) => res.json())
      .then((data: { required?: boolean }) => {
        if (!alive) return;
        // required:false = 未设访客码，门禁关闭；数据异常时宁可拦下（fail-closed）
        if (data?.required === false) pass();
        else setPhase("locked");
      })
      .catch(() => {
        if (alive) setPhase("locked");
      });
    return () => {
      alive = false;
    };
  }, [pass]);

  useEffect(() => {
    if (phase === "locked") inputRef.current?.focus();
  }, [phase]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const value = code.trim();
    if (!value || phase !== "locked") return;
    setPhase("busy");
    setError("");
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: value }),
      });
      if (res.ok) {
        pass();
        return;
      }
      setError(
        res.status === 429
          ? pickT(
              "尝试次数过多，请 15 分钟后再试",
              "嘗試次數過多，請 15 分鐘後再試",
              "Too many attempts — try again in 15 minutes",
              "Trop de tentatives — réessayez dans 15 minutes",
            )
          : pickT(
              "访客码不正确",
              "訪客碼不正確",
              "Incorrect guest code",
              "Code invité incorrect",
            ),
      );
      setPhase("locked");
    } catch {
      setError(
        pickT(
          "网络异常，请重试",
          "網絡異常，請重試",
          "Network error — please retry",
          "Erreur réseau — veuillez réessayer",
        ),
      );
      setPhase("locked");
    }
  };

  return (
    <motion.div
      data-visit-gate
      data-gate-phase={phase}
      className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-bg"
      initial={false}
      animate={phase === "leaving" ? { y: "-101%" } : { y: 0 }}
      transition={{ duration: reduced ? 0.01 : 0.9, ease: [0.76, 0, 0.24, 1] }}
      onAnimationComplete={() => {
        if (phase === "leaving") onPass();
      }}
    >
      <div className="flex w-full flex-col items-center gap-5 px-6 text-center">
        <span className="text-[11px] tracking-[.34em] text-muted">PORTFOLIO · 2026</span>
        <span className="font-serif text-[clamp(2.4rem,6vw,3.9rem)] font-medium leading-none text-fg">
          {pickT("你的名字", "你的名字", "Your Name", "Votre nom")}
        </span>
        <svg aria-hidden="true" viewBox={`0 0 ${sig.w} ${sig.h}`} className="w-[min(86vw,32rem)]">
          <path
            d={sig.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            className="text-fg/45"
          />
        </svg>

        {phase === "checking" ? (
          <span role="status" className="mt-3 block h-px w-44 overflow-hidden bg-fg/15">
            <motion.span
              className="block h-full w-full origin-left bg-fg/60"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
            />
          </span>
        ) : (
          <form onSubmit={submit} className="mt-3 flex w-full max-w-sm flex-col items-center gap-3">
            <p className="text-[11px] tracking-[.24em] text-muted">
              {pickT(
                "项目与科研 · 凭访客码进入",
                "項目與科研 · 憑訪客碼進入",
                "PROJECTS & RESEARCH · ENTER YOUR GUEST CODE",
                "PROJETS & RECHERCHE · CODE INVITÉ",
              )}
            </p>
            <div className="flex w-full items-stretch gap-2">
              <input
                ref={inputRef}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  if (error) setError("");
                }}
                type="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                disabled={phase === "busy" || phase === "leaving"}
                placeholder={pickT("访客码", "訪客碼", "Guest code", "Code invité")}
                aria-label={pickT("访客码", "訪客碼", "Guest code", "Code invité")}
                className="h-11 min-w-0 flex-1 rounded-sm border border-line/25 bg-transparent px-4 text-center text-sm tracking-[.24em] text-fg outline-none transition-colors placeholder:tracking-[.1em] placeholder:text-muted/70 focus:border-fg/50 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={phase === "busy" || phase === "leaving" || !code.trim()}
                className="h-11 shrink-0 rounded-sm border border-fg/30 bg-fg/5 px-5 text-sm font-semibold text-fg transition-colors hover:bg-fg/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet-400 disabled:opacity-40 disabled:hover:bg-fg/5"
              >
                {phase === "busy"
                  ? pickT("验证中", "驗證中", "Checking", "Vérification")
                  : pickT("进入", "進入", "Enter", "Entrer")}
              </button>
            </div>
            {error ? (
              <p role="alert" className="text-xs leading-5 text-red-500 dark:text-red-400">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </motion.div>
  );
}
