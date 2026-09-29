import { z } from "zod";
export const mediaReportSchema = z
  .object({
    version: z.literal(1),
    id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/),
    at: z.string().datetime(),
    kind: z.enum(["photo", "video", "audio"]),
    model: z.literal("elevate-observe-0.1"),
    modelRelease: z
      .string()
      .regex(/^[a-f0-9]{64}$/)
      .optional(),
    metrics: z
      .array(
        z
          .object({
            key: z.enum([
              "lighting",
              "framing",
              "head_position",
              "volume",
              "speech_seconds",
              "pause_seconds",
              "clipping",
              "frames",
            ]),
            value: z.number().finite().min(-120).max(10000),
            unit: z.enum(["score", "dBFS", "seconds", "fraction", "count"]),
            reliability: z.number().min(0).max(1),
          })
          .strict(),
      )
      .max(12),
    notes: z.array(z.string().max(400)).max(10),
  })
  .strict()
  .superRefine((report, ctx) => {
    const expected: Record<string, string> = {
      lighting: "score",
      framing: "score",
      head_position: "score",
      volume: "dBFS",
      speech_seconds: "seconds",
      pause_seconds: "seconds",
      clipping: "fraction",
      frames: "count",
    };
    const seen = new Set<string>();
    for (const m of report.metrics) {
      if (
        seen.has(m.key) ||
        expected[m.key] !== m.unit ||
        ((m.unit === "score" || m.unit === "fraction") &&
          (m.value < 0 || m.value > 1)) ||
        (m.unit !== "dBFS" && m.value < 0) ||
        (m.unit === "dBFS" && m.value > 0)
      )
        ctx.addIssue({ code: "custom", message: "Invalid observation metric" });
      seen.add(m.key);
    }
  });
export type MediaReport = z.infer<typeof mediaReportSchema>;
export function parseMediaMessage(
  data: unknown,
  session: string,
): MediaReport | null {
  try {
    if (typeof data !== "string" || data.length > 12000) return null;
    const message = JSON.parse(data);
    if (message.type !== "elevate-observation" || message.session !== session)
      return null;
    const parsed = mediaReportSchema.safeParse(message.report);
    if (!parsed.success) return null;
    const age = Date.now() - Date.parse(parsed.data.at);
    return age >= -5000 && age < 300000 ? parsed.data : null;
  } catch {
    return null;
  }
}
