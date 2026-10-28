import { estimateYearsOfExperience } from "./extract";
import { findEvidence, hasPhrase, normalize, tokenize } from "./normalize";
import type { AISemanticMatch, MatchLevel, Requirement, RequirementMatch } from "./types";

const EDUCATION_RANK: Record<string, number> = {
  "Tecnólogo": 1,
  "Certificação": 1,
  "Ensino superior completo": 2,
  "Graduação completa": 2,
  "Bacharelado": 2,
  "Pós-graduação": 3,
  "MBA": 3,
  "Mestrado": 3,
  "Doutorado": 4,
};

const EDUCATION_ALIASES: Array<{ rank: number; terms: string[] }> = [
  { rank: 4, terms: ["doutorado", "phd"] },
  { rank: 3, terms: ["mestrado", "mba", "pos graduacao", "especializacao"] },
  { rank: 2, terms: ["bacharelado", "graduacao", "ensino superior", "superior completo", "tecnologo"] },
  { rank: 1, terms: ["certificacao", "curso tecnico", "tecnico"] },
];

interface MatchContext {
  resumeText: string;
  normalizedResume: string;
}

function evidenceOf(context: MatchContext, term: string) {
  return findEvidence(context.resumeText, term);
}

function matchSkill(requirement: Requirement, context: MatchContext): RequirementMatch {
  const terms = [...requirement.terms].sort((a, b) => b.length - a.length);

  for (const term of terms) {
    const hit = evidenceOf(context, term);
    if (hit.occurrences > 0) {
      return {
        requirement,
        level: "exact",
        evidence: hit.snippet,
        occurrences: hit.occurrences,
        confidence: "high",
      };
    }
  }

  const meaningful = tokenize(requirement.label).filter((token) => token.length > 3);
  const present = meaningful.filter((token) => hasPhrase(context.normalizedResume, token));

  if (present.length > 0 && meaningful.length > 0) {
    return {
      requirement,
      level: "partial",
      evidence: "",
      occurrences: 0,
      rationale: `Termo isolado encontrado (${present.join(", ")}), mas sem contexto que confirme "${requirement.label}".`,
      confidence: "low",
    };
  }

  return {
    requirement,
    level: "missing",
    evidence: "",
    occurrences: 0,
    confidence: "high",
  };
}

function matchYears(requirement: Requirement, context: MatchContext): RequirementMatch {
  const required = Number(requirement.detail ?? "0");
  const estimated = estimateYearsOfExperience(context.resumeText);

  if (estimated <= 0) {
    return {
      requirement,
      level: "missing",
      evidence: "",
      occurrences: 0,
      rationale: "Não foi possível identificar datas ou tempo de experiência no currículo.",
      confidence: "low",
    };
  }

  const level: MatchLevel =
    estimated >= required ? "exact" : estimated >= required * 0.6 ? "partial" : "missing";

  return {
    requirement,
    level,
    evidence: `${estimated} ano(s) estimado(s) a partir das datas do currículo.`,
    occurrences: 1,
    rationale: `Requisito: ${required} ano(s). Estimativa pelo texto, não uma validação oficial.`,
    confidence: estimated >= required ? "medium" : "low",
  };
}

function resumeLevelRank(normalizedResume: string, languageKey: string): number {
  for (const level of [...LANGUAGE_LEVEL_RANKS].sort((a, b) => b.rank - a.rank)) {
    if (level.aliases.some((alias) => hasPhrase(normalizedResume, `${languageKey} ${alias}`))) {
      return level.rank;
    }
  }
  return 0;
}

const LANGUAGE_LEVEL_RANKS = [
  { rank: 4, aliases: ["fluente", "nativo", "c2"] },
  { rank: 3, aliases: ["avancado", "c1"] },
  { rank: 2, aliases: ["intermediario", "b1", "b2", "tecnico"] },
  { rank: 1, aliases: ["basico", "iniciante", "a1", "a2"] },
];

function matchLanguage(requirement: Requirement, context: MatchContext): RequirementMatch {
  const languageKey = normalize(requirement.terms[0] ?? requirement.label);
  const requiredRank = Number(requirement.detail ?? "0");

  if (!hasPhrase(context.normalizedResume, languageKey)) {
    return {
      requirement,
      level: "missing",
      evidence: "",
      occurrences: 0,
      confidence: "high",
    };
  }

  const foundRank = resumeLevelRank(context.normalizedResume, languageKey);
  const languageLabel = languageKey.charAt(0).toUpperCase() + languageKey.slice(1);

  if (requiredRank === 0) {
    return {
      requirement,
      level: "exact",
      evidence: `Idioma "${languageLabel}" citado no currículo.`,
      occurrences: 1,
      confidence: "medium",
    };
  }

  if (foundRank >= requiredRank) {
    return {
      requirement,
      level: "exact",
      evidence: `Idioma "${languageLabel}" com nível declarado compatível.`,
      occurrences: 1,
      confidence: "medium",
    };
  }

  if (foundRank === 0) {
    return {
      requirement,
      level: "partial",
      evidence: `Idioma "${languageLabel}" citado sem nível declarado.`,
      occurrences: 1,
      rationale: "Declare o nível apenas se ele corresponder à sua realidade.",
      confidence: "low",
    };
  }

  return {
    requirement,
    level: "partial",
    evidence: `Nível declarado abaixo do pedido na vaga.`,
    occurrences: 1,
    confidence: "medium",
  };
}

function resumeEducationRank(normalizedResume: string): number {
  let rank = 0;
  for (const entry of EDUCATION_ALIASES) {
    if (entry.terms.some((term) => hasPhrase(normalizedResume, term))) {
      rank = Math.max(rank, entry.rank);
    }
  }
  return rank;
}

function matchEducation(requirement: Requirement, context: MatchContext): RequirementMatch {
  const terms = [...requirement.terms].sort((a, b) => b.length - a.length);

  for (const term of terms) {
    const hit = evidenceOf(context, term);
    if (hit.occurrences > 0) {
      return {
        requirement,
        level: "exact",
        evidence: hit.snippet,
        occurrences: hit.occurrences,
        confidence: "high",
      };
    }
  }

  const requiredRank = EDUCATION_RANK[requirement.label] ?? 2;
  const foundRank = resumeEducationRank(context.normalizedResume);

  if (foundRank >= requiredRank) {
    return {
      requirement,
      level: "semantic",
      evidence: "",
      occurrences: 0,
      rationale: "Formação de nível equivalente ou superior identificada no currículo.",
      confidence: "medium",
    };
  }

  return {
    requirement,
    level: "missing",
    evidence: "",
    occurrences: 0,
    confidence: "high",
  };
}

function matchOne(requirement: Requirement, context: MatchContext): RequirementMatch {
  switch (requirement.kind) {
    case "years":
      return matchYears(requirement, context);
    case "language":
      return matchLanguage(requirement, context);
    case "education":
      return matchEducation(requirement, context);
    case "license": {
      const hit = evidenceOf(context, requirement.terms[0] ?? requirement.label);
      return hit.occurrences > 0
        ? {
            requirement,
            level: "exact",
            evidence: hit.snippet,
            occurrences: hit.occurrences,
            confidence: "high",
          }
        : { requirement, level: "missing", evidence: "", occurrences: 0, confidence: "high" };
    }
    default:
      return matchSkill(requirement, context);
  }
}

export function matchRequirements(requirements: Requirement[], resumeText: string): RequirementMatch[] {
  const context: MatchContext = { resumeText, normalizedResume: normalize(resumeText) };
  return requirements.map((requirement) => matchOne(requirement, context));
}

/**
 * Aplica a interpretação semântica da IA sobre a análise determinística.
 * A IA não cria requisitos nem define pontuação: só pode reclassificar um
 * requisito existente e justificar.
 */
export function applySemanticMatches(
  matches: RequirementMatch[],
  semanticMatches: AISemanticMatch[],
): { matches: RequirementMatch[]; applied: number; ignored: string[] } {
  const byId = new Map(matches.map((match) => [match.requirement.id, match]));
  const byLabel = new Map(matches.map((match) => [normalize(match.requirement.label), match]));
  const ignored: string[] = [];
  let applied = 0;

  for (const semantic of semanticMatches) {
    const target =
      byId.get(normalize(semantic.requirement).replace(/[^a-z0-9]+/g, "-")) ??
      byLabel.get(normalize(semantic.requirement));

    if (!target) {
      ignored.push(semantic.requirement);
      continue;
    }

    if (target.level === semantic.level && !semantic.rationale) continue;

    target.level = semantic.level;
    target.confidence = "medium";
    if (semantic.rationale) target.rationale = semantic.rationale.slice(0, 400);
    if (semantic.evidence) target.evidence = semantic.evidence.slice(0, 400);
    applied += 1;
  }

  return { matches, applied, ignored };
}
