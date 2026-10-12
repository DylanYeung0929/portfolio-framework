// Cloudflare Worker：策展 / 访客码门禁 / 订阅 API。
// 由 wrangler 直接 esbuild 打包，禁止使用 "@/" 别名 import。

interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}

export interface Env {
  /** KV 绑定（wrangler.jsonc 里的 kv_namespaces.binding） */
  KV: KVNamespaceLike;
  /** 后台口令；不设置 = 无法登录 */
  ADMIN_PASSWORD?: string;
  /** 访客码；不设置 = 门禁关闭（GET /api/gate 返回 required:false） */
  GATE_CODE?: string;
}

const CURATION_KEY = "pf-curation";
const SESSION_TTL = 60 * 60 * 24 * 30;
const LOGIN_MAX_FAILS = 10;
const LOGIN_WINDOW = 15 * 60;
const MAX_BODY = 512 * 1024;
const COOKIE = "pf_admin";
// 每个订阅独占一个 KV 键，便于后续按 pf-subscriber: 前缀列举导出
const SUBSCRIBER_PREFIX = "pf-subscriber:";
const SUBSCRIBE_MAX = 6;
const SUBSCRIBE_WINDOW = 60 * 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GATE_MAX_FAILS = 20;
const GATE_WINDOW = 15 * 60;
const GATE_LOG_PREFIX = "pf-gate-log:";
const GATE_LOG_TTL = 90 * 24 * 60 * 60;

const json = (data: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extra,
    },
  });

const sha256 = async (text: string) =>
  new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get("Cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

async function getSessionToken(request: Request, env: Env): Promise<string | null> {
  const token = getCookie(request, COOKIE);
  if (!token) return null;
  const stored = await env.KV.get(`pf-session:${token}`);
  return stored ? token : null;
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const failKey = `pf-login-fail:${ip}`;
  const fails = Number((await env.KV.get(failKey)) ?? "0");
  if (fails >= LOGIN_MAX_FAILS) return json({ error: "尝试次数过多，请 15 分钟后再试" }, 429);

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") password = body.password;
  } catch {
    password = "";
  }

  const [given, expected] = await Promise.all([
    sha256(password),
    sha256(env.ADMIN_PASSWORD ?? ""),
  ]);
  if (!env.ADMIN_PASSWORD || !timingSafeEqual(given, expected)) {
    await env.KV.put(failKey, String(fails + 1), { expirationTtl: LOGIN_WINDOW });
    return json({ error: "口令不正确" }, 401);
  }

  await env.KV.delete(failKey);
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
  await env.KV.put(`pf-session:${token}`, "1", { expirationTtl: SESSION_TTL });
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return json({ ok: true }, 200, {
    "Set-Cookie": `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL}${secure}`,
  });
}

async function handleSubscribe(request: Request, env: Env): Promise<Response> {
  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const rateKey = `pf-subscribe-rate:${ip}`;
  const hits = Number((await env.KV.get(rateKey)) ?? "0");
  if (hits >= SUBSCRIBE_MAX) return json({ error: "提交过于频繁，请稍后再试" }, 429);

  let email = "";
  try {
    const body = (await request.json()) as { email?: unknown };
    if (typeof body.email === "string") email = body.email.trim().toLowerCase();
  } catch {
    email = "";
  }
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: "邮箱格式不正确" }, 400);
  }

  await env.KV.put(rateKey, String(hits + 1), { expirationTtl: SUBSCRIBE_WINDOW });

  const key = `${SUBSCRIBER_PREFIX}${email}`;
  const existing = await env.KV.get(key);
  if (existing) return json({ ok: true, already: true });

  await env.KV.put(key, JSON.stringify({ email, at: new Date().toISOString() }));
  return json({ ok: true });
}

/** 记录一次访客码输入（成功 / 失败），供后台「访客码记录」查看 */
async function logGate(request: Request, env: Env, ok: boolean): Promise<void> {
  const entry = {
    ip: request.headers.get("CF-Connecting-IP") ?? "unknown",
    at: new Date().toISOString(),
    ok,
    ua: (request.headers.get("user-agent") ?? "").slice(0, 200),
  };
  try {
    await env.KV.put(
      `${GATE_LOG_PREFIX}${Date.now()}:${crypto.randomUUID().slice(0, 6)}`,
      JSON.stringify(entry),
      { expirationTtl: GATE_LOG_TTL },
    );
  } catch {
    // 记录失败不影响门禁本身
  }
}

async function handleGate(request: Request, env: Env): Promise<Response> {
  if (request.method === "GET") return json({ required: Boolean(env.GATE_CODE) });
  if (request.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  if (!env.GATE_CODE) return json({ ok: true, required: false });

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const failKey = `pf-gate-fail:${ip}`;
  const fails = Number((await env.KV.get(failKey)) ?? "0");
  if (fails >= GATE_MAX_FAILS) return json({ error: "尝试次数过多，请 15 分钟后再试" }, 429);

  let code = "";
  try {
    const body = (await request.json()) as { code?: unknown };
    if (typeof body.code === "string") code = body.code;
  } catch {
    code = "";
  }

  const [given, expected] = await Promise.all([
    sha256(code),
    sha256(env.GATE_CODE),
  ]);
  if (!timingSafeEqual(given, expected)) {
    await env.KV.put(failKey, String(fails + 1), { expirationTtl: GATE_WINDOW });
    await logGate(request, env, false);
    return json({ error: "访客码不正确" }, 401);
  }

  await env.KV.delete(failKey);
  await logGate(request, env, true);
  return json({ ok: true });
}

async function handleGateLogs(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return json({ error: "Method Not Allowed" }, 405);
  if (!(await getSessionToken(request, env))) return json({ error: "未登录" }, 401);

  const { keys } = await env.KV.list({ prefix: GATE_LOG_PREFIX, limit: 1000 });
  const recent = keys
    .map((key) => key.name)
    .sort()
    .slice(-200)
    .reverse();
  const logs = await Promise.all(
    recent.map(async (name) => {
      const raw = await env.KV.get(name);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return null;
      }
    }),
  );
  return json({ logs: logs.filter(Boolean) });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === "/api/curation") {
      if (request.method === "GET") {
        const raw = await env.KV.get(CURATION_KEY);
        return new Response(raw ?? "{}", {
          headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
        });
      }
      if (request.method === "PUT") {
        if (!(await getSessionToken(request, env))) return json({ error: "未登录" }, 401);
        const text = await request.text();
        if (text.length > MAX_BODY) return json({ error: "数据过大" }, 413);
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          return json({ error: "无效 JSON" }, 400);
        }
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return json({ error: "格式错误" }, 400);
        }
        await env.KV.put(CURATION_KEY, JSON.stringify(parsed));
        return json({ ok: true });
      }
      return json({ error: "Method Not Allowed" }, 405);
    }

    if (pathname === "/api/gate") return handleGate(request, env);

    if (pathname === "/api/gate/logs") return handleGateLogs(request, env);

    if (pathname === "/api/subscribe" && request.method === "POST") return handleSubscribe(request, env);

    if (pathname === "/api/login" && request.method === "POST") return handleLogin(request, env);

    if (pathname === "/api/logout" && request.method === "POST") {
      const token = getCookie(request, COOKIE);
      if (token) await env.KV.delete(`pf-session:${token}`);
      return json({ ok: true }, 200, { "Set-Cookie": `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` });
    }

    if (pathname === "/api/session" && request.method === "GET") {
      const token = await getSessionToken(request, env);
      return token ? json({ ok: true }) : json({ ok: false }, 401);
    }

    return json({ error: "Not Found" }, 404);
  },
};
