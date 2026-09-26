import { z } from "zod";
import { AREAS, exercises } from "../coach";
const exerciseId = z
  .string()
  .refine((id) => exercises.some((e) => e.id === id));
const timestamp = z.string().refine((s) => Number.isFinite(Date.parse(s)));
const rating = z.number().int().min(1).max(5);
export const stateSchema = z.object({
  version: z.literal(1),
  profile: z
    .object({
      name: z.string().min(1),
      role: z.string(),
      goal: z.string(),
      context: z.string(),
      minutes: z.number().min(1).max(60),
      focus: z.enum(AREAS),
      confidence: rating,
      startedAt: timestamp,
    })
    .nullable(),
  assignment: z.object({ exerciseId, rehearsedAt: timestamp }).nullable(),
  learned: z.array(exerciseId),
  reflections: z.array(
    z.object({
      id: z.string(),
      exerciseId,
      at: timestamp,
      confidence: rating,
      note: z.string(),
      next: z.string(),
      situation: z.string(),
    }),
  ),
  wardrobe: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      color: z.string(),
      mediaId: z.string().optional(),
    }),
  ),
  occasions: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      date: z.string(),
      checked: z.array(z.string()),
    }),
  ),
  reviews: z
    .array(
      z.object({
        id: z.string(),
        at: timestamp,
        win: z.string().max(2000),
        obstacle: z.string().max(2000),
        commitment: z.string().max(2000),
        focus: z.enum(AREAS),
      }),
    )
    .default([]),
  memories: z
    .array(
      z.object({ id: z.string(), text: z.string().max(2000), at: timestamp }),
    )
    .max(100)
    .default([]),
  assessments: z
    .array(
      z.object({
        id: z.string(),
        at: timestamp,
        kind: z.string(),
        feedback: z.string().max(20000),
        mediaId: z.string().optional(),
      }),
    )
    .default([]),
  brand: z
    .object({
      audience: z.string(),
      expertise: z.string(),
      value: z.string(),
      statement: z.string(),
    })
    .default({ audience: "", expertise: "", value: "", statement: "" }),
  preferences: z
    .object({
      reminderHour: z.number().int().min(0).max(23),
      reminderMinute: z.number().int().min(0).max(59),
      reminders: z.boolean(),
      retentionDays: z.union([z.literal(0), z.literal(7), z.literal(30)]),
      culture: z.string().max(100),
    })
    .default({
      reminderHour: 9,
      reminderMinute: 0,
      reminders: false,
      retentionDays: 0,
      culture: "Ask the host",
    }),
  scenarioResults: z
    .array(z.object({ id: z.string(), correct: z.boolean(), at: timestamp }))
    .default([]),
});
