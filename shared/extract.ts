import { hasPhrase, normalize, phraseIndex, slugify, stripDiacritics, tokenize } from "./normalize";
import { BEHAVIORAL_TERMS, LANGUAGE_LEVELS, LANGUAGE_NAMES, SKILL_ENTRIES } from "./skills";
import type { Priority, Requirement, RequirementCategory, RequirementKind, ScoringBucket } from "./types";

const PREFERRED_MARKERS =
  /desejavel|diferencial|preferencialmente|nao obrigatori|seria um plus|(?:e|como) um plus|opcional/;
const REQUIRED_MARKERS =
  /obrigatori|requisito|necessari|imprescindivel|exigencia|exige|minimo|voce precisa|buscamos/;

const PRIORITY_RANK: Record<Priority, number> = { preferred: 1, unspecified: 2, required: 3 };

/** Divide em linhas e períodos, preservando a ordem original. */
export function splitSentences(text: string): string[] {
  return text
    .split(/\n+/)
    .flatMap((line) => line.split(/(?<=[.!?;])\s+/))
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export function detectPriority(sentence: string): Priority {
  const normalized = normalize(sentence);
  if (PREFERRED_MARKERS.test(normalized)) return "preferred";
  if (REQUIRED_MARKERS.test(normalized)) return "required";
  return "unspecified";
}

function strongPriority(current: Priority, candidate: Priority): Priority {
  return PRIORITY_RANK[candidate] > PRIORITY_RANK[current] ? candidate : current;
}

function bucketFor(
  category: RequirementCategory,
  priority: Priority,
  kind: RequirementKind,
): ScoringBucket {
  if (category === "technical" || category === "tools") return "technical";
  if (category === "experience") return "experience";
  if (category === "education") return "education";
  if (kind === "language" || kind === "license") {
    return priority === "required" ? "mandatory" : "other";
  }
  return "other";
}

interface RequirementDraft {
  label: string;
  terms: string[];
  category: RequirementCategory;
  priority: Priority;
  kind: RequirementKind;
  source: Requirement["source"];
  detail?: string;
}

function toRequirement(draft: RequirementDraft): Requirement {
  const terms = [...new Set([draft.label, ...draft.terms].map(normalize).filter(Boolean))];
  return {
    id: slugify(draft.label),
    label: draft.label,
    terms,
    category: draft.category,
    bucket: bucketFor(draft.category, draft.priority, draft.kind),
    priority: draft.priority,
    kind: draft.kind,
    source: draft.source,
    ...(draft.detail === undefined ? {} : { detail: draft.detail }),
  };
}

const EDUCATION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /ensino superior (completo|cursando|em andamento)/, label: "Ensino superior completo" },
  { pattern: /graduacao (completa|completo|cursando)/, label: "Graduação completa" },
  { pattern: /bacharelado/, label: "Bacharelado" },
  { pattern: /tecnologo/, label: "Tecnólogo" },
  { pattern: /pos graduacao|especializacao/, label: "Pós-graduação" },
  { pattern: /mestrado/, label: "Mestrado" },
  { pattern: /doutorado/, label: "Doutorado" },
  { pattern: /mba/, label: "MBA" },
  { pattern: /certificacao|certificado/, label: "Certificação" },
];

const YEAR_RANGE = /(\d{1,2})\s*(?:\+)?\s*anos?/;

/** Cabeçalho que muda a prioridade das linhas seguintes ("Requisitos:", "Desejável:"). */
const SECTION_HEADERS = /^(?:requisitos?(?: obrigatorios?)?|desejave(?:l|is)|diferenciais?|preferencialmente|opcional|nao obrigatorio)$/;

/** Conectivo que transforma "A ou B" em um único requisito alternativo. */
const ALTERNATIVE_JOIN = /^(?:e\s+)?ou$/;

function isPriorityHeader(normalizedSentence: string): boolean {
  return SECTION_HEADERS.test(normalizedSentence);
}

interface TermHit {
  label: string;
  terms: string[];
  start: number;
  end: number;
}

/**
 * Encontra termos de dicionário na frase, descartando o que está dentro de um
 * termo maior ("css" dentro de "tailwind css") e agrupando alternativas
 * explícitas ("vitest ou jest" vira um único requisito).
 */
function findSkillHits(normalizedSentence: string): TermHit[] {
  const hits: TermHit[] = [];

  for (const entry of SKILL_ENTRIES) {
    const terms = [entry.label, ...entry.aliases];
    for (const alias of terms) {
      const start = phraseIndex(normalizedSentence, alias);
      if (start === -1) continue;
      hits.push({
        label: entry.label,
        terms,
        start,
        end: start + normalize(alias).length,
      });
      break;
    }
  }

  hits.sort((a, b) => a.start - b.start);

  const standalone = hits.filter(
    (hit) =>
      !hits.some(
        (other) =>
          other !== hit &&
          other.start <= hit.start &&
          other.end >= hit.end &&
          other.end - other.start > hit.end - hit.start,
      ),
  );

  const groups: TermHit[] = [];

  for (const hit of standalone) {
    const previous = groups[groups.length - 1];
    const gap = previous ? normalizedSentence.slice(previous.end, hit.start).trim() : "";

    if (previous && ALTERNATIVE_JOIN.test(gap)) {
      previous.label = `${previous.label} ou ${hit.label}`;
      previous.terms = [...new Set([...previous.terms, ...hit.terms])];
      previous.end = Math.max(previous.end, hit.end);
      continue;
    }

    groups.push({ ...hit, terms: [...hit.terms] });
  }

  return groups;
}

/**
 * Extrai requisitos objetivos da vaga.
 *
 * Determinístico de propósito: só entra o que o texto sustenta — termo de
 * dicionário, faixa de anos, formação, idioma ou licença. O resto fica para a
 * camada de IA, que é opcional.
 */
export function extractRequirements(jobText: string): Requirement[] {
  const sentences = splitSentences(jobText);
  const drafts = new Map<string, RequirementDraft>();
  const normalizedSentences = sentences.map((sentence) => normalize(sentence));
  let sectionPriority: Priority = "unspecified";

  const register = (draft: RequirementDraft) => {
    const id = slugify(draft.label);
    const existing = drafts.get(id);
    if (!existing) {
      drafts.set(id, draft);
      return;
    }
    existing.priority = strongPriority(existing.priority, draft.priority);
    existing.terms = [...new Set([...existing.terms, ...draft.terms])];
  };

  normalizedSentences.forEach((sentence, index) => {
    const original = sentences[index] ?? "";

    if (isPriorityHeader(sentence)) {
      sectionPriority = detectPriority(original);
      return;
    }

    const ownPriority = detectPriority(original);
    const priority = ownPriority === "unspecified" ? sectionPriority : ownPriority;

    for (const hit of findSkillHits(sentence)) {
      register({
        label: hit.label,
        terms: hit.terms,
        category: SKILL_ENTRIES.find((entry) => entry.label === hit.label.split(" ou ")[0])?.category ?? "technical",
        priority,
        kind: "skill",
        source: "dictionary",
      });
    }

    for (const term of BEHAVIORAL_TERMS) {
      const matched = [term.label, ...term.aliases].some((alias) => hasPhrase(sentence, alias));
      if (!matched) continue;
      register({
        label: term.label,
        terms: [term.label, ...term.aliases],
        category: "behavioral",
        priority,
        kind: "generic",
        source: "dictionary",
      });
    }

    if (/experiencia/.test(sentence)) {
      const yearsMatch = YEAR_RANGE.exec(sentence);
      if (yearsMatch?.[1]) {
        const years = Number(yearsMatch[1]);
        if (Number.isFinite(years) && years > 0 && years <= 40) {
          register({
            label: `Experiência de ${years}+ anos`,
            terms: [],
            category: "experience",
            priority,
            kind: "years",
            source: "pattern",
            detail: String(years),
          });
        }
      }
    }

    for (const education of EDUCATION_PATTERNS) {
      if (!education.pattern.test(sentence)) continue;
      register({
        label: education.label,
        terms: [education.label],
        category: "education",
        priority,
        kind: "education",
        source: "pattern",
      });
      break;
    }

    for (const language of LANGUAGE_NAMES) {
      const languageKey = normalize(language);
      if (!hasPhrase(sentence, languageKey)) continue;

      const level = LANGUAGE_LEVELS.find((candidate) =>
        candidate.aliases.some((alias) => sentence.includes(`${languageKey} ${alias}`)),
      );

      register({
        label: level ? `${language} ${level.label}` : language,
        terms: [languageKey],
        category: "other",
        priority,
        kind: "language",
        source: "pattern",
        ...(level ? { detail: String(level.rank) } : {}),
      });
    }

    if (/cnh|carteira de motorista|habilitacao categoria/.test(sentence)) {
      register({
        label: "CNH / habilitação",
        terms: ["cnh", "carteira de motorista", "habilitacao"],
        category: "other",
        priority,
        kind: "license",
        source: "pattern",
      });
    }
  });

  return [...drafts.values()].map(toRequirement).slice(0, 60);
}

/** Anos de experiência estimados a partir de faixas de data ou menção explícita. */
export function estimateYearsOfExperience(resumeText: string): number {
  const normalized = normalize(resumeText);
  const withPunctuation = stripDiacritics(resumeText).toLowerCase();
  let explicit = 0;

  for (const match of normalized.matchAll(/(\d{1,2})\s*(?:\+)?\s*anos?/g)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) explicit = Math.max(explicit, value);
  }

  let longestRange = 0;
  const rangePattern =
    /\b(19\d{2}|20\d{2})\s*(?:-|–|—|a|ate|até)\s*(19\d{2}|20\d{2}|atual|presente|hoje)\b/g;

  for (const match of withPunctuation.matchAll(rangePattern)) {
    const start = Number(match[1]);
    const endRaw = match[2] ?? "";
    const end = /^\d{4}$/.test(endRaw) ? Number(endRaw) : new Date().getFullYear();
    if (Number.isFinite(start) && end >= start) {
      longestRange = Math.max(longestRange, end - start);
    }
  }

  return Math.max(explicit, longestRange);
}

export function tokensOf(value: string): string[] {
  return tokenize(value);
}
