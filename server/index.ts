import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import { analyzeDeterministic, finalizeAnalysis } from "../shared/analyze";
import { extractRequirements } from "../shared/extract";
import { applySemanticMatches } from "../shared/match";
import { normalizeOptimizedResume } from "../shared/optimize";
import type { AnalysisMode, AnalyzeResponse } from "../shared/types";
import { AIError, readAIConfig, requestAIAnalysis } from "./ai";
import { createRateLimiter } from "./rate-limit";
import { analyzeRequestSchema } from "./schema";

const PORT = Number(process.env.PORT ?? 8787);
const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 12);
const aiConfig = readAIConfig();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", "loopback");
app.use(express.json({ limit: "1mb" }));

const limiter = createRateLimiter(Number.isFinite(RATE_LIMIT) && RATE_LIMIT > 0 ? RATE_LIMIT : 12);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    ai: aiConfig !== null,
    model: aiConfig?.model ?? null,
  });
});

app.post("/api/analyze", limiter, async (req: Request, res: Response) => {
  const parsed = analyzeRequestSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_input",
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
      issues: parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "raiz",
        message: issue.message,
      })),
    });
    return;
  }

  const { jobText, resumeText, useAI } = parsed.data;
  const warnings: string[] = [];
  let mode: AnalysisMode = "deterministic";
  let aiModel: string | undefined;

  const base = analyzeDeterministic({ jobText, resumeText });
  let analysis = base;

  if (useAI && !aiConfig) {
    warnings.push(
      "IA não configurada neste ambiente (AI_API_KEY ausente). A análise usou apenas regras determinísticas.",
    );
  }

  if (useAI && aiConfig) {
    try {
      const requirements = extractRequirements(jobText);
      const { data, model } = await requestAIAnalysis({
        config: aiConfig,
        jobText,
        resumeText,
        requirements,
      });

      const { matches, ignored } = applySemanticMatches(base.matches, data.semanticMatches);

      if (ignored.length > 0) {
        warnings.push(
          `A IA citou ${ignored.length} requisito(s) fora da lista extraída; esses itens foram ignorados para não alterar a pontuação.`,
        );
      }

      analysis = finalizeAnalysis({
        jobText,
        resumeText,
        matches,
        extraSuggestions: data.suggestions,
        criteriaNotes: data.criteriaNotes,
        optimizedResume: normalizeOptimizedResume(data.optimizedResume, base.optimizedResume),
        extraIntegrity: [
          "A versão otimizada foi sugerida por IA e precisa de revisão antes de ser enviada.",
          ...data.warnings.slice(0, 3),
        ],
      });

      mode = "ai";
      aiModel = model;
    } catch (error) {
      const kind = error instanceof AIError ? error.kind : "unknown";
      const messages: Record<string, string> = {
        timeout: "A IA demorou além do limite. O resultado abaixo veio do motor determinístico.",
        http: "O provedor de IA recusou a requisição. O resultado abaixo veio do motor determinístico.",
        network: "Não foi possível conectar ao provedor de IA. O resultado abaixo veio do motor determinístico.",
        parse: "A resposta da IA não passou na validação. O resultado abaixo veio do motor determinístico.",
        unknown: "A IA falhou de forma inesperada. O resultado abaixo veio do motor determinístico.",
      };
      warnings.push(messages[kind] ?? messages.unknown ?? "");
    }
  }

  const payload: AnalyzeResponse = {
    analysis,
    mode,
    warnings,
    ...(aiModel ? { aiModel } : {}),
  };

  res.json(payload);
});

// Em produção local, o mesmo servidor entrega o build do Vite.
const distDir = path.resolve(process.cwd(), "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(path.join(distDir, "index.html"));
  });
}

app.use((_req, res) => {
  res.status(404).json({ error: "not_found" });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const isBodyError = error instanceof Error && "type" in error && error.type === "entity.too.large";
  if (isBodyError) {
    res.status(413).json({ error: "payload_too_large", message: "Texto enviado acima do limite permitido." });
    return;
  }
  res.status(500).json({ error: "internal_error", message: "Falha inesperada ao processar a análise." });
});

app.listen(PORT, () => {
  console.log(`[match-ats] api em http://localhost:${PORT}`);
  console.log(
    aiConfig
      ? `[match-ats] IA habilitada (modelo ${aiConfig.model})`
      : "[match-ats] IA desabilitada — modo determinístico local",
  );
});
