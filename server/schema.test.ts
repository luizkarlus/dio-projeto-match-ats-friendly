import { describe, expect, it } from "vitest";
import { MAX_JOB_CHARS, MAX_RESUME_CHARS, aiAnalysisSchema, analyzeRequestSchema } from "./schema";

const JOB = "Vaga fictícia para pessoa desenvolvedora com React e TypeScript.";
const RESUME =
  "Pessoa Exemplo\npessoa@exemplo.com\n\nEXPERIÊNCIA PROFISSIONAL\nDesenvolvimento de interfaces com React e TypeScript.";

const VALID_AI = {
  semanticMatches: [
    { requirement: "React", level: "exact", evidence: "React", rationale: "Cita React." },
  ],
  criteriaNotes: [{ category: "technical", note: "Núcleo técnico coberto." }],
  suggestions: [
    {
      title: "Reorganizar experiências",
      detail: "Coloque a experiência mais recente primeiro.",
      kind: "structure",
    },
  ],
  optimizedResume: "Pessoa Exemplo\n\nRESUMO PROFISSIONAL\nDesenvolvedora front-end.",
  warnings: [],
};

describe("analyzeRequestSchema", () => {
  it("aceita entrada válida", () => {
    const parsed = analyzeRequestSchema.safeParse({ jobText: JOB, resumeText: RESUME });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.useAI).toBe(true);
  });

  it("rejeita campos vazios", () => {
    expect(analyzeRequestSchema.safeParse({ jobText: "", resumeText: RESUME }).success).toBe(false);
    expect(analyzeRequestSchema.safeParse({ jobText: JOB, resumeText: "   " }).success).toBe(false);
  });

  it("rejeita texto curto demais", () => {
    const parsed = analyzeRequestSchema.safeParse({ jobText: "Curta", resumeText: RESUME });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toContain("40 caracteres");
    }
  });

  it("aplica o limite de tamanho", () => {
    const parsed = analyzeRequestSchema.safeParse({
      jobText: "a".repeat(MAX_JOB_CHARS + 1),
      resumeText: RESUME,
    });
    expect(parsed.success).toBe(false);
  });

  it("rejeita currículo acima do limite", () => {
    const parsed = analyzeRequestSchema.safeParse({
      jobText: JOB,
      resumeText: "a".repeat(MAX_RESUME_CHARS + 1),
    });
    expect(parsed.success).toBe(false);
  });

  it("rejeita tipo errado e campo desconhecido não interfere", () => {
    expect(analyzeRequestSchema.safeParse({ jobText: 42, resumeText: RESUME }).success).toBe(false);
    expect(analyzeRequestSchema.safeParse({ jobText: JOB, resumeText: RESUME, extra: "x" }).success).toBe(true);
  });

  it("remove espaços nas bordas", () => {
    const parsed = analyzeRequestSchema.safeParse({ jobText: `  ${JOB}  `, resumeText: `  ${RESUME}  ` });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.jobText).toBe(JOB);
  });
});

describe("aiAnalysisSchema", () => {
  it("aceita resposta no contrato", () => {
    const parsed = aiAnalysisSchema.safeParse(VALID_AI);
    expect(parsed.success).toBe(true);
  });

  it("descarta resposta sem o currículo otimizado", () => {
    const { optimizedResume: _ignored, ...withoutResume } = VALID_AI;
    expect(aiAnalysisSchema.safeParse(withoutResume).success).toBe(false);
  });

  it("rejeita nível de correspondência inválido", () => {
    const invalid = {
      ...VALID_AI,
      semanticMatches: [{ requirement: "React", level: "quase", evidence: null, rationale: null }],
    };
    expect(aiAnalysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejeita categoria desconhecida", () => {
    const invalid = { ...VALID_AI, criteriaNotes: [{ category: "idiomas", note: "x" }] };
    expect(aiAnalysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejeita tipo de sugestão desconhecido", () => {
    const invalid = {
      ...VALID_AI,
      suggestions: [{ title: "Título", detail: "Detalhe", kind: "inventado" }],
    };
    expect(aiAnalysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejeita currículo otimizado vazio", () => {
    expect(aiAnalysisSchema.safeParse({ ...VALID_AI, optimizedResume: "" }).success).toBe(false);
  });

  it("rejeita excesso de itens", () => {
    const invalid = {
      ...VALID_AI,
      suggestions: Array.from({ length: 7 }, () => VALID_AI.suggestions[0]),
    };
    expect(aiAnalysisSchema.safeParse(invalid).success).toBe(false);
  });

  it("aceita evidência e justificativa nulas", () => {
    const parsed = aiAnalysisSchema.safeParse({
      ...VALID_AI,
      semanticMatches: [{ requirement: "React", level: "unknown", evidence: null, rationale: null }],
    });
    expect(parsed.success).toBe(true);
  });

  it("preenche listas opcionais com padrão vazio", () => {
    const parsed = aiAnalysisSchema.safeParse({ optimizedResume: "Texto do currículo otimizado." });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.semanticMatches).toEqual([]);
      expect(parsed.data.warnings).toEqual([]);
    }
  });
});
