// 内容策展：前端读取/保存后台选片结果（Cloudflare Worker + KV）。
// Worker 不可用时静默回退默认图，站点行为与未接入前完全一致。

import { useEffect, useState, useSyncExternalStore } from "react";

export type ImgRef =
  | { t: "asset"; key: string }
  | { t: "url"; url: string };

export type Curation = {
  v: 1;
  /** 槽位 id -> 覆盖图；组件用 useImgUrl(slots["some.slot"], fallback) 读取 */
  slots?: Record<string, ImgRef>;
};

const empty: Curation = { v: 1 };

let curation: Curation = empty;
let loadStarted = false;
const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) listener();
};

export function getCuration(): Curation {
  return curation;
}

async function fetchCuration() {
  try {
    const res = await fetch("/api/curation", { headers: { accept: "application/json" } });
    if (!res.ok) return;
    const data = (await res.json()) as unknown;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      curation = data as Curation;
      emit();
    }
  } catch {
    // 无 Worker（如纯 vite dev）时保持默认
  }
}

export function useCuration(): Curation {
  const value = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => curation,
  );
  useEffect(() => {
    if (!loadStarted) {
      loadStarted = true;
      void fetchCuration();
    }
  }, []);
  return value;
}

export async function saveCuration(next: Curation): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/curation", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    if (res.ok) {
      curation = next;
      emit();
      return { ok: true };
    }
    let error = `保存失败（${res.status}）`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) error = data.error;
    } catch {
      // 保留默认错误信息
    }
    return { ok: false, error };
  } catch {
    return { ok: false, error: "网络错误，未连接后台服务" };
  }
}

export async function login(password: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) return { ok: true };
    let error = "登录失败";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) error = data.error;
    } catch {
      // 保留默认错误信息
    }
    return { ok: false, error };
  } catch {
    return { ok: false, error: "无法连接后台服务" };
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/logout", { method: "POST" });
  } catch {
    // 忽略
  }
}

export async function checkSession(): Promise<boolean> {
  try {
    const res = await fetch("/api/session");
    return res.ok;
  } catch {
    return false;
  }
}

export type GateLog = {
  ip: string;
  at: string;
  ok: boolean;
  /** 输入时所在路由 */
  route?: string | null;
  ua?: string | null;
  chUa?: string | null;
  chPlatform?: string | null;
  chMobile?: string | null;
  lang?: string | null;
  referer?: string | null;
  origin?: string | null;
  country?: string | null;
  continent?: string | null;
  region?: string | null;
  regionCode?: string | null;
  city?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  asn?: number | null;
  asOrg?: string | null;
  colo?: string | null;
  httpProtocol?: string | null;
  tlsVersion?: string | null;
  tlsCipher?: string | null;
  rtt?: number | null;
};

/** 访客码记录（时间 / IP / 设备 / 位置与网络链路），需后台会话 */
export async function fetchGateLogs(): Promise<{ ok: boolean; logs?: GateLog[]; error?: string }> {
  try {
    const res = await fetch("/api/gate/logs");
    if (!res.ok) return { ok: false, error: `读取失败（${res.status}）` };
    const data = (await res.json()) as { logs?: GateLog[] };
    return { ok: true, logs: Array.isArray(data?.logs) ? data.logs : [] };
  } catch {
    return { ok: false, error: "网络错误，未连接后台服务" };
  }
}

// ---- 素材库（src/assets 下打包进来的图片），同步可用 ----

const assetModules = import.meta.glob("../assets/**/*.{jpg,jpeg,png,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export type AssetFile = { key: string; url: string; group: string; name: string };

export const assetFiles: AssetFile[] = Object.entries(assetModules)
  .map(([path, url]) => {
    const key = path.replace("../assets/", "");
    const [group, ...rest] = key.split("/");
    return { key, url, group, name: rest.join("/") };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

export function assetUrl(key: string): string | undefined {
  return assetModules[`../assets/${key}`];
}

/** 把 ImgRef 解析成可用的图片 URL；无覆盖时返回 fallback。 */
export function useImgUrl(ref: ImgRef | undefined, fallback: string): string {
  const [url, setUrl] = useState(fallback);
  const sig = ref ? (ref.t === "asset" ? `asset:${ref.key}` : `url:${ref.url}`) : "";
  useEffect(() => {
    if (!ref) {
      setUrl(fallback);
      return;
    }
    if (ref.t === "asset") setUrl(assetUrl(ref.key) ?? fallback);
    else setUrl(ref.url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, fallback]);
  return url;
}
