import { contentRoute } from "./content";
import { z } from "zod";
import { stateSchema } from "../src/shared/schema";
import { initialState } from "../src/coach";
import {
  equal,
  HttpError,
  jsonBody,
  limitedBody,
  passwordHash,
  randomToken,
  sha256,
} from "./security";
interface Env {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  APP_ORIGIN: string;
  ALLOWED_ORIGINS: string;
}
type User = {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  recovery_hash: string;
};
const now = () => Math.floor(Date.now() / 1000);
const json = (
  data: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
const credentials = z.object({
  email: z
    .string()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(12).max(128),
});
async function limit(env: Env, key: string, max: number, seconds: number) {
  const window = Math.floor(now() / seconds);
  const result = await env.DB.prepare(
    "INSERT INTO rate_limits(key,hits,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET hits=hits+1 RETURNING hits",
  )
    .bind(`${key}:${window}`, now() + seconds)
    .first<{ hits: number }>();
  if ((result?.hits || 0) > max)
    throw new HttpError(429, "Too many requests. Please try again later.");
}
function token(request: Request) {
  return (
    request.headers.get("Authorization")?.replace(/^Bearer /, "") ||
    request.headers
      .get("Cookie")
      ?.match(/(?:^|; )elevate_session=([^;]+)/)?.[1] ||
    ""
  );
}
async function userFor(request: Request, env: Env) {
  const t = token(request);
  if (!t) throw new HttpError(401, "Sign in to use cloud features.");
  const u = await env.DB.prepare(
    "SELECT users.* FROM users JOIN sessions ON sessions.user_id=users.id WHERE token_hash=? AND expires_at>?",
  )
    .bind(await sha256(t), now())
    .first<User>();
  if (!u)
    throw new HttpError(401, "Your session expired. Please sign in again.");
  return u;
}
function cookie(value: string, request: Request, maxAge = 2592000) {
  return `elevate_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
async function signIn(
  u: User,
  request: Request,
  env: Env,
  recoveryCode?: string,
) {
  const session = randomToken();
  await env.DB.prepare(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
  )
    .bind(await sha256(session), u.id, now() + 2592000)
    .run();
  const native =
    request.headers.get("X-Elevate-Client") === "native" &&
    !request.headers.has("Origin");
  return json(
    {
      user: { id: u.id, email: u.email },
      ...(native ? { token: session } : {}),
      ...(recoveryCode ? { recoveryCode } : {}),
    },
    200,
    { "Set-Cookie": cookie(session, request) },
  );
}
async function handle(request: Request, env: Env): Promise<Response> {
  const path = new URL(request.url).pathname;
  const method = request.method;
  const content = await contentRoute(request, env, () => userFor(request, env));
  if (content) return content;
  if (path === "/api/health")
    return json({ ok: true, ai: false, coaching: "manual-chatgpt-json" });
  if (path.startsWith("/api/auth/") && method === "POST") {
    await limit(
      env,
      `auth:${await sha256(request.headers.get("CF-Connecting-IP") || "local")}`,
      20,
      900,
    );
    if (path === "/api/auth/logout") {
      await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?")
        .bind(await sha256(token(request)))
        .run();
      return json({ ok: true }, 200, { "Set-Cookie": cookie("", request, 0) });
    }
    const input = await jsonBody(request, 4096);
    if (path === "/api/auth/recover") {
      const b = credentials
        .extend({ recoveryCode: z.string().length(64) })
        .parse(input);
      const u = await env.DB.prepare("SELECT * FROM users WHERE email=?")
        .bind(b.email)
        .first<User>();
      if (!u || !equal(await sha256(b.recoveryCode), u.recovery_hash))
        throw new HttpError(400, "The email and recovery code do not match.");
      const salt = randomToken(),
        recovery = randomToken();
      await env.DB.batch([
        env.DB.prepare(
          "UPDATE users SET password_hash=?,salt=?,recovery_hash=? WHERE id=?",
        ).bind(
          await passwordHash(b.password, salt),
          salt,
          await sha256(recovery),
          u.id,
        ),
        env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(u.id),
      ]);
      return signIn(u, request, env, recovery);
    }
    const b = credentials.parse(input);
    await limit(env, `account:${await sha256(b.email)}`, 10, 900);
    if (path === "/api/auth/register") {
      throw new HttpError(
        403,
        "Account creation is managed by your administrator.",
      );
    }
    if (path === "/api/auth/login") {
      const u = await env.DB.prepare("SELECT * FROM users WHERE email=?")
        .bind(b.email)
        .first<User>();
      const hash = await passwordHash(
        b.password,
        u?.salt || "invalid-account-salt",
      );
      if (!u || !equal(hash, u.password_hash))
        throw new HttpError(401, "The email or password is incorrect.");
      return signIn(u, request, env);
    }
    throw new HttpError(404, "Unknown authentication action.");
  }
  if (path === "/api/telemetry" && method === "POST") {
    await limit(
      env,
      `telemetry:${await sha256(request.headers.get("CF-Connecting-IP") || "local")}`,
      10,
      3600,
    );
    const input = z
      .object({ code: z.literal("ui_render") })
      .parse(await jsonBody(request, 1024));
    await env.DB.prepare("INSERT INTO events VALUES(?,?,?,?)")
      .bind(crypto.randomUUID(), "client", input.code, now())
      .run();
    return json({ ok: true });
  }
  const u = await userFor(request, env);
  if (path === "/api/me" && method === "GET")
    return json({ user: { id: u.id, email: u.email } });
  if (path === "/api/state" && method === "GET") {
    const row = await env.DB.prepare(
      "SELECT document,revision FROM coach_state WHERE user_id=?",
    )
      .bind(u.id)
      .first<{ document: string; revision: number }>();
    return json({
      state: row ? stateSchema.parse(JSON.parse(row.document)) : initialState(),
      revision: row?.revision || 0,
    });
  }
  if (path === "/api/state" && method === "PUT") {
    const b = z
      .object({ state: stateSchema, revision: z.number().int().nonnegative() })
      .parse(await jsonBody(request));
    const result = await env.DB.prepare(
      "UPDATE coach_state SET document=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=? RETURNING revision",
    )
      .bind(JSON.stringify(b.state), now(), u.id, b.revision)
      .first<{ revision: number }>();
    if (!result)
      throw new HttpError(
        409,
        "Another device saved changes. Download the cloud copy or export your local copy before replacing it.",
      );
    return json(result);
  }
  if (path === "/api/export" && method === "GET") {
    const row = await env.DB.prepare(
      "SELECT document FROM coach_state WHERE user_id=?",
    )
      .bind(u.id)
      .first<{ document: string }>();
    const media = await env.DB.prepare(
      "SELECT id,mime,purpose,created_at,expires_at FROM media WHERE user_id=?",
    )
      .bind(u.id)
      .all();
    return json({
      exportedAt: new Date().toISOString(),
      account: { email: u.email },
      state: JSON.parse(row?.document || "{}"),
      media: media.results,
    });
  }
  if (path === "/api/account" && method === "DELETE") {
    const b = z
      .object({ password: z.string() })
      .parse(await jsonBody(request, 4096));
    if (!equal(await passwordHash(b.password, u.salt), u.password_hash))
      throw new HttpError(
        403,
        "Enter your current password to delete the account.",
      );
    const objects = await env.DB.prepare(
      "SELECT object_key FROM media WHERE user_id=?",
    )
      .bind(u.id)
      .all<{ object_key: string }>();
    for (let i = 0; i < objects.results.length; i += 100)
      await env.MEDIA.delete(
        objects.results.slice(i, i + 100).map((x) => x.object_key),
      );
    await env.DB.prepare("DELETE FROM users WHERE id=?").bind(u.id).run();
    return json({ ok: true }, 200, { "Set-Cookie": cookie("", request, 0) });
  }
  if (path === "/api/media" && method === "GET") {
    return json(
      (
        await env.DB.prepare(
          "SELECT id,mime,purpose,created_at,expires_at FROM media WHERE user_id=? AND expires_at>? ORDER BY created_at DESC",
        )
          .bind(u.id, now())
          .all()
      ).results,
    );
  }
  if (path === "/api/media" && method === "POST") {
    await limit(env, `upload:${u.id}`, 30, 3600);
    if (request.headers.get("X-Media-Consent") !== "yes")
      throw new HttpError(400, "Explicit upload consent is required.");
    const mime = request.headers.get("Content-Type")?.split(";")[0] || "";
    const allowed = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/webm",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/x-m4a",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];
    if (!allowed.includes(mime))
      throw new HttpError(415, "Unsupported media type.");
    const purpose = z
      .enum(["photo", "wardrobe", "voice", "video"])
      .parse(request.headers.get("X-Media-Purpose"));
    if (
      ((purpose === "photo" || purpose === "wardrobe") &&
        !mime.startsWith("image/")) ||
      (purpose === "voice" && !mime.startsWith("audio/")) ||
      (purpose === "video" && !mime.startsWith("video/"))
    )
      throw new HttpError(
        415,
        "This file does not match the selected purpose.",
      );
    const days = Number(request.headers.get("X-Retention-Days") || 0);
    if (![0, 7, 30].includes(days))
      throw new HttpError(400, "Choose a supported retention period.");
    const bytes = await limitedBody(
      request,
      purpose === "video" ? 20 * 1024 * 1024 : 5 * 1024 * 1024,
    );
    if (!bytes.length) throw new HttpError(400, "The media file is empty.");
    const id = crypto.randomUUID(),
      key = `${u.id}/${id}`,
      expires = now() + (days === 0 ? 3600 : days * 86400);
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
    try {
      await env.DB.prepare("INSERT INTO media VALUES(?,?,?,?,?,?,?,?)")
        .bind(id, u.id, key, mime, bytes.length, purpose, now(), expires)
        .run();
    } catch (e) {
      await env.MEDIA.delete(key);
      throw e;
    }
    return json({ id, expiresAt: expires }, 201);
  }
  const mediaMatch = path.match(/^\/api\/media\/([a-f0-9-]+)$/);
  if (mediaMatch) {
    const m = await env.DB.prepare(
      "SELECT * FROM media WHERE id=? AND user_id=?",
    )
      .bind(mediaMatch[1], u.id)
      .first<{ object_key: string; mime: string; expires_at: number }>();
    if (!m) throw new HttpError(404, "Media not found.");
    if (method === "DELETE") {
      await env.MEDIA.delete(m.object_key);
      await env.DB.prepare("DELETE FROM media WHERE id=? AND user_id=?")
        .bind(mediaMatch[1], u.id)
        .run();
      return json({ ok: true });
    }
    if (method === "GET") {
      if (m.expires_at <= now())
        throw new HttpError(410, "This media has expired.");
      const object = await env.MEDIA.get(m.object_key);
      if (!object) throw new HttpError(404, "Media not found.");
      return new Response(object.body, {
        headers: {
          "Content-Type": m.mime,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
          "Content-Disposition": "inline",
        },
      });
    }
  }
  if ((path === "/api/coach" || path === "/api/analyze") && method === "POST") {
    throw new HttpError(
      410,
      "Use the coaching studio JSON exchange with ChatGPT. Automated AI processing has been removed.",
    );
  }
  throw new HttpError(404, "API route not found.");
}
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    const origin = request.headers.get("Origin");
    const allowed = new Set([
      env.APP_ORIGIN,
      ...(env.ALLOWED_ORIGINS || "").split(","),
    ]);
    if (origin && !allowed.has(origin))
      return json({ error: "Origin not allowed." }, 403);
    if (
      !["GET", "HEAD", "OPTIONS"].includes(request.method) &&
      request.headers.get("X-Elevate-Request") !== "1"
    )
      return json({ error: "Missing request verification header." }, 403);
    const headers: Record<string, string> = {
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      Vary: "Origin",
    };
    if (origin) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Credentials"] = "true";
    }
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
          "Access-Control-Allow-Headers":
            "Content-Type,Authorization,X-Elevate-Request,X-Elevate-Client,X-Media-Consent,X-Media-Purpose,X-Retention-Days",
        },
      });
    let response: Response;
    try {
      response = await handle(request, env);
    } catch (e) {
      if (e instanceof HttpError)
        response = json({ error: e.message }, e.status);
      else if (e instanceof z.ZodError)
        response = json({ error: "Please check the supplied fields." }, 400);
      else {
        const id = crypto.randomUUID();
        console.error(
          JSON.stringify({
            event: "api_failure",
            id,
            path: url.pathname,
            method: request.method,
          }),
        );
        ctx.waitUntil(
          env.DB.prepare("INSERT INTO events VALUES(?,?,?,?)")
            .bind(id, "api", "internal_error", now())
            .run()
            .catch(() => {}),
        );
        response = json(
          {
            error:
              "The service could not complete this request. Please try again.",
            reference: id,
          },
          500,
        );
      }
    }
    const result = new Response(response.body, response);
    for (const [k, v] of Object.entries(headers)) result.headers.set(k, v);
    return result;
  },
  async scheduled(_event: ScheduledController, env: Env) {
    const expired = await env.DB.prepare(
      "SELECT id,object_key FROM media WHERE expires_at<=? LIMIT 500",
    )
      .bind(now())
      .all<{ id: string; object_key: string }>();
    for (const item of expired.results) {
      await env.MEDIA.delete(item.object_key);
      await env.DB.prepare("DELETE FROM media WHERE id=?").bind(item.id).run();
    }
    await env.DB.batch([
      env.DB.prepare("DELETE FROM sessions WHERE expires_at<=?").bind(now()),
      env.DB.prepare("DELETE FROM rate_limits WHERE expires_at<=?").bind(now()),
      env.DB.prepare("DELETE FROM events WHERE created_at<?").bind(
        now() - 30 * 86400,
      ),
    ]);
  },
} satisfies ExportedHandler<Env>;
