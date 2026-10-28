import { describe, expect, it } from "vitest";
import { computeScore, describeScore } from "./score";
import type { MatchLevel, Priority, Requirement, RequirementMatch, ScoringBucket } from "./types";

function requirement(
  label: string,
  bucket: ScoringBucket,
  priority: Priority = "unspecified",
): Requirement {
  return {
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    terms: [label],
    category: bucket === "technical" ? "technical" : bucket === "education" ? "education" : "other",
    bucket,
    priority,
    kind: "skill",
    source: "dictionary",
  };
}

function match(label: string, bucket: ScoringBucket, level: MatchLevel, priority: Priority = "unspecified"): RequirementMatch {
  return {
    requirement: requirement(label, bucket, priority),
    level,
    occurrences: level === "missing" ? 0 : 1,
    confidence: "high",
  };
}

describe("computeScore", () => {
  it("retorna zero quando não há requisitos", () => {
    const score = computeScore([]);
    expect(score.total).toBe(0);
    expect(score.buckets).toEqual([]);
    expect(score.redistributed).toBe(true);
  });

  it("atinge 100 quando todo requisito é exato", () => {
    const score = computeScore([
      match("React", "technical", "exact"),
      match("TypeScript", "technical", "exact"),
      match("Inglês", "mandatory", "exact"),
    ]);
    expect(score.total).toBe(100);
  });

  it("atinge zero quando todos os requisitos estão ausentes", () => {
    const score = computeScore([match("React", "technical", "missing"), match("Inglês", "mandatory", "missing")]);
    expect(score.total).toBe(0);
  });

  it("redistribui pesos entre as categorias aplicáveis", () => {
    const score = computeScore([match("React", "technical", "exact"), match("Inglês", "mandatory", "missing")]);
    expect(score.redistributed).toBe(true);
    expect(score.buckets.map((bucket) => bucket.bucket)).toEqual(["technical", "mandatory"]);
    const weights = score.buckets.reduce((sum, bucket) => sum + bucket.weight, 0);
    expect(Math.round(weights)).toBe(100);
    // 40 / (40 + 20) = 66,7% técnico e 33,3% obrigatório.
    expect(score.buckets[0]?.weight).toBe(66.7);
    expect(score.buckets[1]?.weight).toBe(33.3);
  });

  it("mantém os pesos originais quando todas as categorias se aplicam", () => {
    const score = computeScore([
      match("React", "technical", "exact"),
      match("Experiência", "experience", "exact"),
      match("Inglês", "mandatory", "exact"),
      match("Graduação", "education", "exact"),
      match("CNH", "other", "exact"),
    ]);
    expect(score.redistributed).toBe(false);
    expect(score.buckets.map((bucket) => bucket.weight)).toEqual([40, 25, 20, 10, 5]);
  });

  it("não pune requisito indeterminado: ele sai do denominador", () => {
    const onlyUnknown = computeScore([match("React", "technical", "unknown")]);
    expect(onlyUnknown.total).toBe(0);
    expect(onlyUnknown.buckets).toEqual([]);

    const withUnknown = computeScore([
      match("React", "technical", "exact"),
      match("Kubernetes", "technical", "unknown"),
    ]);
    expect(withUnknown.total).toBe(100);
    expect(withUnknown.buckets[0]?.total).toBe(1);
    expect(withUnknown.buckets[0]?.unknown).toBe(1);
  });

  it("valoriza parcial abaixo de exato", () => {
    const exact = computeScore([match("React", "technical", "exact")]).total;
    const partial = computeScore([match("React", "technical", "partial")]).total;
    const semantic = computeScore([match("React", "technical", "semantic")]).total;

    expect(partial).toBe(55);
    expect(semantic).toBe(85);
    expect(partial).toBeLessThan(semantic);
    expect(semantic).toBeLessThan(exact);
  });

  it("dá mais peso ao requisito obrigatório dentro do bucket", () => {
    const score = computeScore([
      match("React", "technical", "exact", "required"),
      match("Next.js", "technical", "missing", "preferred"),
    ]);
    // (1 × 3) / (3 + 1,5) = 0,666… → 67
    expect(score.total).toBe(67);
  });

  it("limita o resultado entre 0 e 100", () => {
    const matches = [
      match("React", "technical", "exact"),
      match("Experiência", "experience", "exact"),
      match("Inglês", "mandatory", "exact"),
      match("Graduação", "education", "exact"),
      match("CNH", "other", "exact"),
    ];
    const total = computeScore(matches).total;
    expect(total).toBeGreaterThanOrEqual(0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it("documenta a redistribuição na fórmula", () => {
    const score = computeScore([match("React", "technical", "exact")]);
    expect(score.formula).toContain("100% competências técnicas e ferramentas");
    expect(score.formula).toContain("pesos redistribuídos");
  });
});

describe("describeScore", () => {
  it("classifica as faixas de resultado", () => {
    expect(describeScore(85).title).toBe("Alta correspondência textual");
    expect(describeScore(65).title).toBe("Boa correspondência, com lacunas");
    expect(describeScore(45).title).toBe("Correspondência parcial");
    expect(describeScore(10).title).toBe("Correspondência baixa");
  });

  it("nunca promete aprovação no processo seletivo", () => {
    const description = describeScore(95).description.toLowerCase();
    expect(description).not.toContain("aprovado");
    expect(description).not.toContain("garantia");
  });
});
