import { z } from "zod";
export const garmentCategories = [
  "Tops",
  "Bottoms",
  "Dresses",
  "Shoes",
  "Layers",
  "Accessories",
] as const;
export const garmentAnalysisSchema = z
  .object({
    model: z.literal("garment-one-0.1.0"),
    release: z.string().regex(/^[a-f0-9]{64}$/),
    at: z.string().datetime(),
    proposedType: z.string().max(60),
    score: z.number().finite().min(0).max(1),
    accepted: z.boolean(),
    confirmed: z.literal(true),
    formality: z.enum(["Any", "Casual", "Smart", "Formal"]),
  })
  .strict();
export const garmentResultSchema = z
  .object({
    id: z.string().regex(/^garment-[a-zA-Z0-9-]{10,90}$/),
    name: z.string().trim().min(1).max(100),
    category: z.enum(garmentCategories),
    color: z.string().trim().min(1).max(40),
    garmentAnalysis: garmentAnalysisSchema,
  })
  .strict();
export type GarmentResult = z.infer<typeof garmentResultSchema>;
export type GarmentAnalysis = z.infer<typeof garmentAnalysisSchema>;
export function parseGarmentMessage(
  data: unknown,
  session: string,
): GarmentResult | null {
  try {
    if (typeof data !== "string" || data.length > 4000) return null;
    const value = JSON.parse(data);
    if (value.type !== "elevate-garment" || value.session !== session)
      return null;
    const result = garmentResultSchema.safeParse(value.garment);
    if (!result.success) return null;
    const age = Date.now() - Date.parse(result.data.garmentAnalysis.at);
    return age >= -5000 && age < 300000 ? result.data : null;
  } catch {
    return null;
  }
}
