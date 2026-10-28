import { analyzeDeterministic } from "@shared/analyze";
import type { AnalyzeResponse } from "@shared/types";

export class AnalysisError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AnalysisError";
    this.status = status;
  }
}

/**
 * Chama o servidor local. Se ele não estiver no ar, cai para o motor
 * determinístico no próprio navegador — o app nunca fica sem resposta.
 */
export async function requestAnalysis(input: {
  jobText: string;
  resumeText: string;
  useAI: boolean;
}): Promise<AnalyzeResponse> {
  let response: Response;

  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return {
      analysis: analyzeDeterministic(input),
      mode: "offline",
      warnings: [
        "Servidor local indisponível. A análise foi feita no navegador, apenas com regras determinísticas.",
      ],
    };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new AnalysisError(
      body?.message ?? `Não foi possível concluir a análise (HTTP ${response.status}).`,
      response.status,
    );
  }

  return (await response.json()) as AnalyzeResponse;
}
