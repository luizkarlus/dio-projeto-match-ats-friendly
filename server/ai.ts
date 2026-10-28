import type { Requirement } from "../shared/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompt";
import { aiAnalysisSchema, type AIResponsePayload } from "./schema";

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export type AIErrorKind = "network" | "timeout" | "http" | "parse";

export class AIError extends Error {
  readonly kind: AIErrorKind;

  constructor(message: string, kind: AIErrorKind) {
    super(message);
    this.name = "AIError";
    this.kind = kind;
  }
}

export function readAIConfig(env: NodeJS.ProcessEnv = process.env): AIConfig | null {
  const apiKey = env.AI_API_KEY?.trim();
  if (!apiKey) return null;

  const timeout = Number(env.AI_TIMEOUT_MS ?? 45_000);

  return {
    baseUrl: (env.AI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/+$/, ""),
    apiKey,
    model: env.AI_MODEL?.trim() || "gpt-4.1-mini",
    timeoutMs: Number.isFinite(timeout) && timeout > 1_000 ? timeout : 45_000,
  };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callModel(config: AIConfig, messages: ChatMessage[]): Promise<string> {
  let response: Response;

  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages,
      }),
      signal: AbortSignal.timeout(config.timeoutMs),
    });
  } catch (error) {
    const aborted = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new AIError(
      aborted ? "Tempo esgotado na chamada do provedor." : "Falha de rede ao chamar o provedor.",
      aborted ? "timeout" : "network",
    );
  }

  if (!response.ok) {
    throw new AIError(`Provedor respondeu HTTP ${response.status}.`, "http");
  }

  const payload = (await response.json().catch(() => null)) as
    | { choices?: Array<{ message?: { content?: unknown } }> }
    | null;

  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== "string" || content.trim().length === 0) {
    throw new AIError("Resposta sem conteúdo.", "parse");
  }

  return content;
}

function extractJson(raw: string): unknown {
  const withoutFence = raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();

  const start = withoutFence.indexOf("{");
  const end = withoutFence.lastIndexOf("}");
  const candidate = start >= 0 && end > start ? withoutFence.slice(start, end + 1) : withoutFence;

  try {
    return JSON.parse(candidate);
  } catch {
    throw new AIError("Resposta não é JSON válido.", "parse");
  }
}

function validate(raw: string): AIResponsePayload {
  const parsed = aiAnalysisSchema.safeParse(extractJson(raw));

  if (!parsed.success) {
    const fields = parsed.error.issues
      .slice(0, 3)
      .map((issue) => `${issue.path.join(".") || "raiz"}: ${issue.message}`)
      .join("; ");
    throw new AIError(`Resposta fora do contrato (${fields}).`, "parse");
  }

  return parsed.data;
}

/**
 * Chama o provedor compatível com a API de chat da OpenAI e valida o contrato.
 * Uma única tentativa de reparo: se o JSON voltar inválido, pede correção.
 */
export async function requestAIAnalysis(input: {
  config: AIConfig;
  jobText: string;
  resumeText: string;
  requirements: Requirement[];
}): Promise<{ data: AIResponsePayload; model: string }> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: buildUserPrompt({
        jobText: input.jobText,
        resumeText: input.resumeText,
        requirements: input.requirements,
      }),
    },
  ];

  const first = await callModel(input.config, messages);

  try {
    return { data: validate(first), model: input.config.model };
  } catch (error) {
    if (!(error instanceof AIError) || error.kind !== "parse") throw error;

    const repaired = await callModel(input.config, [
      ...messages,
      { role: "assistant", content: first.slice(0, 4_000) },
      {
        role: "user",
        content:
          "A resposta anterior não passou na validação. Devolva SOMENTE o JSON completo no formato pedido, sem comentários e sem markdown.",
      },
    ]);

    return { data: validate(repaired), model: input.config.model };
  }
}
