import { z } from "zod";

export const MAX_JOB_CHARS = 20_000;
export const MAX_RESUME_CHARS = 30_000;

export const analyzeRequestSchema = z.object({
  jobText: z
    .string()
    .trim()
    .min(40, "A descrição da vaga precisa ter pelo menos 40 caracteres.")
    .max(MAX_JOB_CHARS, `A descrição da vaga deve ter no máximo ${MAX_JOB_CHARS} caracteres.`),
  resumeText: z
    .string()
    .trim()
    .min(80, "O currículo precisa ter pelo menos 80 caracteres.")
    .max(MAX_RESUME_CHARS, `O currículo deve ter no máximo ${MAX_RESUME_CHARS} caracteres.`),
  useAI: z.boolean().optional().default(true),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

const levelSchema = z.enum(["exact", "semantic", "partial", "missing", "unknown"]);

const categorySchema = z.enum([
  "technical",
  "behavioral",
  "experience",
  "education",
  "tools",
  "other",
]);

/**
 * Contrato da resposta da IA. Campo fora do esquema = resposta descartada.
 * A IA não devolve nota; a pontuação é recalculada pelo código.
 */
export const aiAnalysisSchema = z.object({
  semanticMatches: z
    .array(
      z.object({
        requirement: z.string().min(1).max(160),
        level: levelSchema,
        evidence: z.string().max(500).nullish(),
        rationale: z.string().max(500).nullish(),
      }),
    )
    .max(60)
    .default([]),
  criteriaNotes: z
    .array(
      z.object({
        category: categorySchema,
        note: z.string().max(600),
      }),
    )
    .max(8)
    .default([]),
  suggestions: z
    .array(
      z.object({
        title: z.string().min(3).max(140),
        detail: z.string().min(3).max(700),
        kind: z.enum(["structure", "clarity", "terminology", "relevance"]),
      }),
    )
    .max(6)
    .default([]),
  optimizedResume: z.string().min(1).max(MAX_RESUME_CHARS),
  warnings: z.array(z.string().max(300)).max(8).default([]),
});

export type AIResponsePayload = z.infer<typeof aiAnalysisSchema>;
