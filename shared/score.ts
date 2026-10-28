import type { BucketScore, MatchLevel, RequirementMatch, ScoreBreakdown, ScoringBucket } from "./types";

export const BUCKET_BASE_WEIGHTS: Record<ScoringBucket, number> = {
  technical: 40,
  experience: 25,
  mandatory: 20,
  education: 10,
  other: 5,
};

export const BUCKET_LABELS: Record<ScoringBucket, string> = {
  technical: "Competências técnicas e ferramentas",
  experience: "Experiência profissional",
  mandatory: "Requisitos obrigatórios",
  education: "Formação e certificações",
  other: "Outros requisitos",
};

/** Valor de cada nível de evidência. `unknown` fica fora do cálculo. */
export const EVIDENCE_VALUE: Record<MatchLevel, number | null> = {
  exact: 1,
  semantic: 0.85,
  partial: 0.55,
  missing: 0,
  unknown: null,
};

/** Requisito obrigatório pesa mais dentro do próprio bucket. */
export const PRIORITY_WEIGHT = {
  required: 3,
  unspecified: 2,
  preferred: 1.5,
} as const;

const BUCKET_ORDER: ScoringBucket[] = ["technical", "experience", "mandatory", "education", "other"];

function emptyBucket(bucket: ScoringBucket): BucketScore {
  return {
    bucket,
    weight: 0,
    coverage: 0,
    exact: 0,
    semantic: 0,
    partial: 0,
    missing: 0,
    unknown: 0,
    total: 0,
  };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Índice de correspondência (0–100) calculado a partir dos requisitos já
 * classificados. Nunca recebe a nota pronta de um modelo.
 */
export function computeScore(matches: RequirementMatch[]): ScoreBreakdown {
  const buckets = BUCKET_ORDER.map(emptyBucket);

  for (const match of matches) {
    const bucket = buckets.find((item) => item.bucket === match.requirement.bucket);
    if (!bucket) continue;

    switch (match.level) {
      case "exact":
        bucket.exact += 1;
        break;
      case "semantic":
        bucket.semantic += 1;
        break;
      case "partial":
        bucket.partial += 1;
        break;
      case "missing":
        bucket.missing += 1;
        break;
      default:
        bucket.unknown += 1;
    }
  }

  for (const bucket of buckets) {
    const relevant = matches.filter(
      (match) => match.requirement.bucket === bucket.bucket && match.level !== "unknown",
    );

    bucket.total = relevant.length;
    if (relevant.length === 0) continue;

    let weighted = 0;
    let weights = 0;

    for (const match of relevant) {
      const value = EVIDENCE_VALUE[match.level] ?? 0;
      const weight = PRIORITY_WEIGHT[match.requirement.priority];
      weighted += value * weight;
      weights += weight;
    }

    bucket.coverage = weights === 0 ? 0 : weighted / weights;
  }

  const applicable = buckets.filter((bucket) => bucket.total > 0);
  const baseSum = applicable.reduce((sum, bucket) => sum + BUCKET_BASE_WEIGHTS[bucket.bucket], 0);

  for (const bucket of applicable) {
    bucket.weight = round1((BUCKET_BASE_WEIGHTS[bucket.bucket] / baseSum) * 100);
  }

  const total =
    applicable.length === 0
      ? 0
      : Math.round(
          Math.min(
            100,
            Math.max(
              0,
              applicable.reduce((sum, bucket) => sum + (bucket.weight / 100) * bucket.coverage, 0) * 100,
            ),
          ),
        );

  const formula =
    applicable.length === 0
      ? "Nenhum requisito classificável foi identificado."
      : applicable.map((bucket) => `${bucket.weight}% ${BUCKET_LABELS[bucket.bucket].toLowerCase()}`).join(" · ") +
        " — pesos redistribuídos entre as categorias aplicáveis.";

  return {
    total,
    buckets: applicable,
    redistributed: applicable.length < BUCKET_ORDER.length,
    formula,
  };
}

export function describeScore(total: number): { title: string; description: string } {
  if (total >= 80) {
    return {
      title: "Alta correspondência textual",
      description:
        "A maior parte dos requisitos identificados aparece no currículo. Revise as lacunas restantes antes de enviar.",
    };
  }
  if (total >= 60) {
    return {
      title: "Boa correspondência, com lacunas",
      description:
        "O núcleo da vaga está coberto. As oportunidades de melhoria estão nas palavras-chave ausentes e na organização.",
    };
  }
  if (total >= 40) {
    return {
      title: "Correspondência parcial",
      description:
        "Parte relevante dos requisitos não aparece de forma explícita. Ajuste a terminologia onde a experiência for real.",
    };
  }
  return {
    title: "Correspondência baixa",
    description:
      "Poucos requisitos da vaga têm evidência no currículo. Pode ser uma vaga distante do seu histórico — ou um currículo com informação não evidenciada.",
  };
}
