import { z } from "zod";
export const studioKinds = ["weekly", "coach", "media"] as const;
export type StudioKind = (typeof studioKinds)[number];
export const imageKeys = [
  "reflection",
  "conversation",
  "speaking",
  "posture",
  "style",
] as const;
const short = z.string().trim().min(1).max(180);
const paragraph = z.string().trim().min(1).max(1400);
export const analysisSchema = z
  .object({
    version: z.literal(1),
    kind: z.enum(studioKinds),
    title: short,
    summary: paragraph,
    evidence: z.array(paragraph).max(6),
    strengths: z.array(paragraph).max(5),
    opportunities: z.array(paragraph).max(5),
    limitations: z.array(paragraph).max(5),
    charts: z
      .array(
        z
          .object({
            title: short,
            type: z.enum(["bar", "trend"]),
            unit: z.enum(["count", "minutes", "percent", "confidence / 5"]),
            max: z.number().finite().positive().max(10000),
            basis: z.enum(["self_reported", "observed", "suggested"]),
            explanation: paragraph,
            points: z
              .array(
                z
                  .object({
                    label: z.string().min(1).max(60),
                    value: z.number().finite().min(0).max(10000),
                  })
                  .strict(),
              )
              .min(1)
              .max(12),
          })
          .strict()
          .superRefine((chart, ctx) => {
            if (chart.points.some((p) => p.value > chart.max))
              ctx.addIssue({
                code: "custom",
                message: "Point values must not exceed the chart maximum.",
              });
            if (chart.unit === "confidence / 5" && chart.max !== 5)
              ctx.addIssue({
                code: "custom",
                message: "Confidence charts must use a maximum of 5.",
              });
            if (chart.unit === "percent" && chart.max !== 100)
              ctx.addIssue({
                code: "custom",
                message: "Percent charts must use a maximum of 100.",
              });
          }),
      )
      .max(3),
    diagram: z
      .object({
        title: short,
        steps: z
          .array(
            z
              .object({
                title: short,
                detail: paragraph,
                image: z.enum(imageKeys),
              })
              .strict(),
          )
          .min(2)
          .max(6),
      })
      .strict(),
    visualGuides: z
      .array(
        z
          .object({
            image: z.enum(imageKeys),
            title: short,
            caption: paragraph,
            tryThis: paragraph,
          })
          .strict(),
      )
      .min(1)
      .max(5),
    actions: z
      .array(
        z
          .object({
            title: short,
            when: short,
            steps: z.array(paragraph).min(1).max(5),
            reflection: paragraph,
          })
          .strict(),
      )
      .min(1)
      .max(5),
  })
  .strict();
export type CoachingAnalysis = z.infer<typeof analysisSchema>;
export function parseAnalysis(raw: string, kind: StudioKind): CoachingAnalysis {
  if (raw.length > 60000)
    throw new Error(
      "This response is too large. Ask ChatGPT for a shorter JSON response (under 60,000 characters).",
    );
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "");
  let data: unknown;
  try {
    data = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "This is not valid JSON. Copy the complete JSON object from ChatGPT, including its opening and closing braces.",
    );
  }
  const result = analysisSchema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(
      `Check ${issue.path.join(".") || "response"}: ${issue.message}. Ask ChatGPT to follow the response_schema in your exported JSON.`,
    );
  }
  if (result.data.kind !== kind)
    throw new Error(
      `This response belongs to the ${result.data.kind} tab. Paste it in the matching tab, or ask ChatGPT to return kind "${kind}".`,
    );
  if (JSON.stringify(result.data).length > 24000)
    throw new Error(
      "Please ask ChatGPT to shorten the analysis to under 24,000 characters before saving.",
    );
  return result.data;
}
