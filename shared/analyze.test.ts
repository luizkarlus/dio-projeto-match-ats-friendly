import { describe, expect, it } from "vitest";
import { analyzeDeterministic, finalizeAnalysis } from "./analyze";
import { extractRequirements } from "./extract";
import { matchRequirements } from "./match";
import { SAMPLE_JOB, SAMPLE_RESUME } from "./samples";

const NOW = new Date("2026-01-05T12:00:00.000Z");

describe("analyzeDeterministic", () => {
  const analysis = analyzeDeterministic({ jobText: SAMPLE_JOB, resumeText: SAMPLE_RESUME, now: NOW });
  const labels = (items: typeof analysis.found) => items.map((item) => item.requirement.label);

  it("encontra as competências que estão nos dois textos", () => {
    expect(labels(analysis.found)).toEqual(
      expect.arrayContaining(["React", "TypeScript", "Tailwind CSS", "Git"]),
    );
  });

  it("não inventa correspondência para o que falta", () => {
    expect(labels(analysis.missing)).toEqual(expect.arrayContaining(["Next.js", "GraphQL"]));
    expect(labels(analysis.found)).not.toContain("Next.js");
  });

  it("trata alternativas como um único requisito", () => {
    const alternative = analysis.found.find((match) => match.requirement.label.includes(" ou "));
    expect(alternative?.requirement.label).toBe("Vitest ou Jest");
    expect(alternative?.level).toBe("exact");
  });

  it("respeita obrigatório e desejável vindos do anúncio", () => {
    const byLabel = new Map(analysis.matches.map((match) => [match.requirement.label, match.requirement]));
    expect(byLabel.get("CI/CD")?.priority).toBe("required");
    expect(byLabel.get("Next.js")?.priority).toBe("preferred");
  });

  it("produz um índice reproduzível entre 0 e 100", () => {
    const again = analyzeDeterministic({ jobText: SAMPLE_JOB, resumeText: SAMPLE_RESUME, now: NOW });
    expect(analysis.score.total).toBe(again.score.total);
    expect(analysis.score.total).toBeGreaterThan(0);
    expect(analysis.score.total).toBeLessThanOrEqual(100);
  });

  it("mantém o texto original no currículo otimizado", () => {
    expect(analysis.optimizedResume).toContain("EXPERIÊNCIA PROFISSIONAL");
    expect(analysis.optimizedResume).toContain("Fintech Aurora");
    expect(analysis.optimizedResume).toContain("Ana Ribeiro");
    expect(analysis.optimizedResume).toContain("Bacharelado em Sistemas de Informação");
  });

  it("não acrescenta tecnologias que o currículo não citava", () => {
    expect(analysis.optimizedResume).not.toContain("Next.js");
    expect(analysis.optimizedResume).not.toContain("GraphQL");
  });

  it("inclui os compromissos de integridade", () => {
    expect(analysis.integrity).toHaveLength(3);
    expect(analysis.integrity.join(" ")).toContain("não é uma nota oficial de ATS");
  });

  it("gera critérios e recomendações com justificativa", () => {
    expect(analysis.criteria.length).toBeGreaterThan(2);
    expect(analysis.criteria.every((criterion) => criterion.note.length > 0)).toBe(true);
    expect(analysis.suggestions.length).toBeGreaterThan(0);
    expect(analysis.suggestions.every((suggestion) => suggestion.detail.length > 20)).toBe(true);
  });

  it("registra estatísticas coerentes", () => {
    expect(analysis.stats.jobChars).toBe(SAMPLE_JOB.length);
    expect(analysis.stats.resumeChars).toBe(SAMPLE_RESUME.length);
    expect(analysis.stats.matchedCount).toBe(analysis.found.length);
    expect(analysis.createdAt).toBe(NOW.toISOString());
  });

  it("funciona com currículo sem nenhuma correspondência", () => {
    const result = analyzeDeterministic({
      jobText: "Vaga para desenvolvedor com React, TypeScript e Kubernetes.",
      resumeText: "Maria Souza\nmaria@exemplo.com\n\nEXPERIÊNCIA PROFISSIONAL\nAtendimento ao cliente em loja de roupas.",
      now: NOW,
    });
    expect(result.found).toHaveLength(0);
    expect(result.score.total).toBe(0);
    expect(result.optimizedResume).toContain("Maria Souza");
  });

  it("não quebra com textos sem requisito reconhecível", () => {
    const result = analyzeDeterministic({
      jobText: "Somos uma empresa de tecnologia com cultura de aprendizado.",
      resumeText: "Fulano de Tal\nfulano@exemplo.com\n\nExperiência em diversas áreas.",
      now: NOW,
    });
    expect(result.stats.requirementCount).toBe(0);
    expect(result.score.formula).toContain("Nenhum requisito");
  });
});

describe("finalizeAnalysis", () => {
  it("recalcula a nota a partir dos níveis, ignorando nota vinda da IA", () => {
    const requirements = extractRequirements("React e TypeScript obrigatórios.");
    const matches = matchRequirements(requirements, "Trabalho com React.");
    const result = finalizeAnalysis({
      jobText: "React e TypeScript obrigatórios.",
      resumeText: "Trabalho com React.",
      matches,
      now: NOW,
    });

    expect(result.score.total).toBeLessThan(100);
    expect(result.found.map((match) => match.requirement.label)).toEqual(["React"]);
  });

  it("incorpora notas da IA sem substituir o cálculo", () => {
    const jobText = "React e TypeScript obrigatórios.";
    const resumeText = "Trabalho com React.";
    const matches = matchRequirements(extractRequirements(jobText), resumeText);

    const result = finalizeAnalysis({
      jobText,
      resumeText,
      matches,
      criteriaNotes: [{ category: "technical", note: "Contexto adicional vindo da IA." }],
      extraSuggestions: [{ title: "Sugestão da IA", detail: "Detalhe", kind: "clarity" }],
      optimizedResume: "CURRÍCULO REESCRITO",
      extraIntegrity: ["A versão otimizada foi sugerida por IA."],
      now: NOW,
    });

    expect(result.optimizedResume).toBe("CURRÍCULO REESCRITO");
    expect(result.suggestions.some((suggestion) => suggestion.title === "Sugestão da IA")).toBe(true);
    expect(result.integrity).toHaveLength(4);
    expect(result.criteria.find((criterion) => criterion.category === "technical")?.note).toContain(
      "Contexto adicional",
    );
    expect(result.score.total).toBeLessThan(100);
  });

  it("não duplica recomendações com o mesmo título", () => {
    const jobText = "React e TypeScript obrigatórios.";
    const resumeText = "Trabalho com React.";
    const matches = matchRequirements(extractRequirements(jobText), resumeText);
    const base = finalizeAnalysis({ jobText, resumeText, matches, now: NOW });

    const duplicated = finalizeAnalysis({
      jobText,
      resumeText,
      matches,
      extraSuggestions: [{ title: base.suggestions[0]?.title ?? "x", detail: "Repetida", kind: "clarity" }],
      now: NOW,
    });

    const titles = duplicated.suggestions.map((suggestion) => suggestion.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });
});
