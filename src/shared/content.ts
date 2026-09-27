import { z } from "zod";
import { AREAS } from "../coach";
export const contentId = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
export const languageCode = z
  .string()
  .regex(/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/)
  .max(30);
const text = z.string().trim().min(1).max(4000);
export function youtubeId(url: string) {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return null;
    const id =
      u.hostname === "youtu.be"
        ? u.pathname.slice(1)
        : ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(
              u.hostname,
            )
          ? u.pathname === "/watch"
            ? u.searchParams.get("v")
            : u.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1]
          : null;
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
export function safeVideoUrl(url: string) {
  if (/^\/api\/content\/media\/[a-f0-9-]{36}$/.test(url)) return true;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !!u.hostname &&
      (/\.mp4$/i.test(u.pathname) || !!youtubeId(url))
    );
  } catch {
    return false;
  }
}
const lesson = z
  .object({
    id: contentId,
    title: text,
    area: z.enum(AREAS),
    minutes: z.number().int().min(1).max(60),
    description: text,
    lesson: text,
    steps: z.array(text).min(1).max(12),
    challenge: text,
  })
  .strict();
const video = z
  .object({
    id: contentId,
    title: text,
    author: text,
    topic: text,
    audio: languageCode,
    lessonIds: z.array(contentId).min(1).max(100),
    url: z
      .string()
      .max(2048)
      .refine(
        safeVideoUrl,
        "Use a HTTPS YouTube/MP4 link or an uploaded lesson media path",
      ),
    format: z.enum(["lesson", "interview"]).default("lesson"),
    note: text,
    practice: text,
  })
  .strict();
const language = z
  .object({
    code: languageCode,
    name: z.string().trim().min(1).max(60),
    strings: z
      .record(z.string().min(1).max(4000), text)
      .refine(
        (v) => Object.keys(v).length > 0 && Object.keys(v).length <= 4000,
        "Supply 1–4000 translations",
      ),
  })
  .strict();
export const contentSchema = z
  .object({
    schemaVersion: z.literal(1),
    lessons: z.array(lesson).max(300),
    videos: z.array(video).max(500),
    languages: z.array(language).max(30),
  })
  .strict()
  .superRefine((v, ctx) => {
    for (const [field, values] of [
      ["lessons", v.lessons.map((x) => x.id)],
      ["videos", v.videos.map((x) => x.id)],
      ["languages", v.languages.map((x) => x.code)],
    ] as const) {
      if (new Set(values).size !== values.length)
        ctx.addIssue({
          code: "custom",
          path: [field],
          message: "Duplicate identifiers are not allowed",
        });
    }
    for (const pack of v.languages)
      for (const key of Object.keys(pack.strings)) {
        if (["__proto__", "constructor", "prototype"].includes(key))
          ctx.addIssue({ code: "custom", message: "Reserved translation key" });
        const placeholders = (s: string) =>
          (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(",");
        if (placeholders(key) !== placeholders(pack.strings[key]))
          ctx.addIssue({
            code: "custom",
            message: `Keep placeholders unchanged in ${key}`,
          });
      }
  });
export type ContentDocument = z.infer<typeof contentSchema>;
export type ContentSnapshot = { revision: number; document: ContentDocument };
export const emptyContent = (): ContentDocument => ({
  schemaVersion: 1,
  lessons: [],
  videos: [],
  languages: [],
});
export function parseContent(raw: string) {
  if (new TextEncoder().encode(raw).length > 2 * 1024 * 1024)
    throw new Error("JSON must be smaller than 2 MB.");
  return contentSchema.parse(
    JSON.parse(
      raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, ""),
    ),
  );
}
