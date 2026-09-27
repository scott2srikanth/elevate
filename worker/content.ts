import { contentSchema, emptyContent } from "../src/shared/content";
import { exercises } from "../src/coach";
import { HttpError, jsonBody, limitedBody } from "./security";
import { z } from "zod";
type Env = { DB: D1Database; MEDIA: R2Bucket };
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
export async function currentContent(env: Env) {
  const row = await env.DB.prepare(
    "SELECT revision,document FROM content_releases ORDER BY revision DESC LIMIT 1",
  ).first<{ revision: number; document: string }>();
  return {
    revision: row?.revision || 0,
    document: row
      ? contentSchema.parse(JSON.parse(row.document))
      : emptyContent(),
  };
}
export async function contentRoute(
  request: Request,
  env: Env,
  getUser: () => Promise<{ id: string }>,
): Promise<Response | null> {
  const path = new URL(request.url).pathname;
  if (path === "/api/content" && request.method === "GET")
    return respond(await currentContent(env));
  if (
    /^\/api\/content\/media\/[a-f0-9-]{36}$/.test(path) &&
    ["GET", "HEAD"].includes(request.method)
  ) {
    const key = `lessons/${path.split("/").pop()}.mp4`;
    const object = await env.MEDIA.get(key, { range: request.headers });
    if (!object) throw new HttpError(404, "Lesson video not found.");
    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
      ETag: object.httpEtag,
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    });
    let status = 200;
    const range = object.range;
    if (range && "offset" in range && range.offset !== undefined) {
      const length = range.length ?? object.size - range.offset;
      headers.set(
        "Content-Range",
        `bytes ${range.offset}-${range.offset + length - 1}/${object.size}`,
      );
      headers.set("Content-Length", String(length));
      status = 206;
    } else headers.set("Content-Length", String(object.size));
    return new Response(request.method === "HEAD" ? null : object.body, {
      status,
      headers,
    });
  }
  if (!path.startsWith("/api/admin/")) return null;
  const user = await getUser();
  const admin = await env.DB.prepare(
    "SELECT user_id FROM administrators WHERE user_id=?",
  )
    .bind(user.id)
    .first();
  if (!admin)
    throw new HttpError(
      403,
      "Administrator access is required. Ask the owner to assign your account.",
    );
  if (path === "/api/admin/content" && request.method === "GET")
    return respond(await currentContent(env));
  if (path === "/api/admin/content" && request.method === "PUT") {
    const input = z
      .object({
        baseRevision: z.number().int().nonnegative(),
        document: contentSchema,
      })
      .strict()
      .parse(await jsonBody(request, 2 * 1024 * 1024));
    const known = new Set([
      ...exercises.map((x) => x.id),
      ...input.document.lessons.map((x) => x.id),
    ]);
    for (const video of input.document.videos)
      if (video.lessonIds.some((id) => !known.has(id)))
        throw new HttpError(
          400,
          `Video ${video.id} references an unknown lesson.`,
        );
    // One atomic insert protects against two administrators overwriting each other.
    const result = await env.DB.prepare(
      "INSERT INTO content_releases(revision,document,published_by,created_at) SELECT ?,?,?,? WHERE COALESCE((SELECT MAX(revision) FROM content_releases),0)=?",
    )
      .bind(
        input.baseRevision + 1,
        JSON.stringify(input.document),
        user.id,
        Math.floor(Date.now() / 1000),
        input.baseRevision,
      )
      .run();
    if (!result.meta.changes)
      throw new HttpError(
        409,
        "Content changed since you loaded it. Reload the published version before applying your draft.",
      );
    return respond({
      revision: input.baseRevision + 1,
      document: input.document,
    });
  }
  if (path === "/api/admin/media" && request.method === "POST") {
    if (request.headers.get("Content-Type") !== "video/mp4")
      throw new HttpError(415, "Upload an MP4 video.");
    const bytes = await limitedBody(request, 32 * 1024 * 1024);
    if (
      bytes.length < 12 ||
      new TextDecoder().decode(bytes.slice(4, 8)) !== "ftyp"
    )
      throw new HttpError(400, "This file is not a supported MP4 video.");
    const id = crypto.randomUUID();
    await env.MEDIA.put(`lessons/${id}.mp4`, bytes, {
      httpMetadata: { contentType: "video/mp4" },
      customMetadata: { uploadedBy: user.id },
    });
    return respond({ url: `/api/content/media/${id}` }, 201);
  }
  throw new HttpError(404, "Unknown administrator action.");
}
