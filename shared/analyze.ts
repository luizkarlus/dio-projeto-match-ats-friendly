import { extractRequirements } from "./extract";
import { matchRequirements } from "./match";
import { buildDeterministicResume, parseResumeDocument } from "./optimize";
import { computeScore } from "./score";
import type {
  AnalysisResult,
  CriterionNote,
  RequirementCategory,
  RequirementMatch,
  Suggestion,
} from "./types";

export const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  technical: "Competências técnicas",
  tools: "Ferramentas e tecnologias",
  behavioral: "Competências comportamentais",
  experience: "Experiência profissional relacionada",
  education: "Formação e certificações",
  other: "Outros requisitos",
};

const CATEGORY_ORDER: RequirementCategory[] = [
  "technical",
  "tools",
  "experience",
  "education",
  "behavioral",
  "other",
];

const EVIDENCED = new Set(["exact", "semantic", "partial"]);

function buildCriteria(matches: RequirementMatch[]): CriterionNote[] {
  return CATEGORY_ORDER.map((category) => {
    const items = matches.filter((match) => match.requirement.category === category);
    if (items.length === 0) {
      return {
        category,
        label: CATEGORY_LABELS[category],
        note: "Nenhum requisito desta categoria foi identificado na descrição da vaga.",
        matched: 0,
        total: 0,
      };
    }

    const matched = items.filter((item) => EVIDENCED.has(item.level)).length;
    const missing = items.filter((item) => item.level === "missing").slice(0, 3);
    const partial = items.filter((item) => item.level === "partial").length;

    const parts = [`${matched} de ${items.length} requisitos com evidência no currículo.`];
    if (partial > 0) parts.push(`${partial} com evidência apenas parcial.`);
    if (missing.length > 0) {
      parts.push(`Sem evidência: ${missing.map((item) => item.requirement.label).join(", ")}.`);
    }

    return {
      category,
      label: CATEGORY_LABELS[category],
      note: parts.join(" "),
      matched,
      total: items.length,
    };
  }).filter((criterion) => criterion.total > 0);
}

function buildSuggestions(matches: RequirementMatch[], resumeText: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const missingRequired = matches.filter(
    (match) => match.level === "missing" && match.requirement.priority === "required",
  );
  const missingPreferred = matches.filter(
    (match) => match.level === "missing" && match.requirement.priority === "preferred",
  );
  const partial = matches.filter((match) => match.level === "partial");

  if (missingRequired.length > 0) {
    suggestions.push({
      title: "Requisitos obrigatórios sem evidência",
      kind: "relevance",
      detail: `A vaga pede ${missingRequired
        .slice(0, 5)
        .map((match) => match.requirement.label)
        .join(", ")}. Se você tem essa experiência, descreva onde e como a aplicou. Se não tem, não invente: considere se a vaga é adequada ao seu momento.`,
    });
  }

  if (missingPreferred.length > 0) {
    suggestions.push({
      title: "Diferenciais ausentes",
      kind: "relevance",
      detail: `São desejáveis, não obrigatórios: ${missingPreferred
        .slice(0, 5)
        .map((match) => match.requirement.label)
        .join(", ")}. Só inclua o que fizer parte do seu histórico.`,
    });
  }

  if (partial.length > 0) {
    suggestions.push({
      title: "Alinhar terminologia onde a competência é a mesma",
      kind: "terminology",
      detail: `${partial
        .slice(0, 4)
        .map((match) => match.requirement.label)
        .join(", ")} aparecem de forma parcial. Use o termo do anúncio apenas se ele descrever o que você realmente fez.`,
    });
  }

  if (!/\d/.test(resumeText)) {
    suggestions.push({
      title: "Resultados mensuráveis — só se existirem",
      kind: "clarity",
      detail:
        "O currículo não traz nenhum número. Se você tem métricas reais (tempo economizado, volume atendido, redução de erro), inclua. Não estime nem invente números.",
    });
  }

  const document = parseResumeDocument(resumeText);
  if (document.sections.length < 2) {
    suggestions.push({
      title: "Padronizar títulos de seção",
      kind: "structure",
      detail:
        "Use títulos convencionais: Resumo Profissional, Experiência Profissional, Formação Acadêmica, Competências e Certificações. Isso ajuda a extração automática.",
    });
  }

  if (document.name.length === 0 || document.contact.length === 0) {
    suggestions.push({
      title: "Contato no topo",
      kind: "structure",
      detail:
        "Inclua nome, e-mail e telefone nas primeiras linhas. Dados como estado civil, foto e documento não são necessários.",
    });
  }

  const longLines = resumeText
    .split("\n")
    .filter((line) => line.trim().length > 220 && !/^\s*[-•]/.test(line));
  if (longLines.length > 0) {
    suggestions.push({
      title: "Quebrar blocos longos em bullets",
      kind: "structure",
      detail:
        "Parágrafos longos dificultam a leitura por pessoas e por sistemas. Uma responsabilidade ou resultado por linha é mais eficaz.",
    });
  }

  if (matches.length > 0 && matches.filter((match) => EVIDENCED.has(match.level)).length / matches.length >= 0.8) {
    suggestions.push({
      title: "Priorizar qualidade, não densidade de palavras-chave",
      kind: "clarity",
      detail:
        "A cobertura já é alta. Nesta etapa, o ganho está em clareza, consistência de datas e descrição de impacto — não em repetir termos da vaga.",
    });
  }

  if (suggestions.length === 0) {
    suggestions.push({
      title: "Revisar antes de enviar",
      kind: "clarity",
      detail:
        "Nenhum ajuste estrutural crítico foi identificado. Confirme se datas, cargos e resultados estão corretos e se cada linha descreve algo que você realmente fez.",
    });
  }

  return suggestions.slice(0, 8);
}

export interface FinalizeInput {
  jobText: string;
  resumeText: string;
  matches: RequirementMatch[];
  extraSuggestions?: Suggestion[];
  criteriaNotes?: Array<{ category: RequirementCategory; note: string }>;
  optimizedResume?: string;
  extraIntegrity?: string[];
  now?: Date;
}

/**
 * Monta o resultado final a partir de requisitos já classificados.
 * A pontuação é sempre recalculada aqui — nenhum texto de IA entra como nota.
 */
export function finalizeAnalysis(input: FinalizeInput): AnalysisResult {
  const matches = input.matches;
  const score = computeScore(matches);
  const found = matches.filter((match) => EVIDENCED.has(match.level));
  const missing = matches.filter((match) => match.level === "missing");

  const criteria = buildCriteria(matches).map((criterion) => {
    const note = input.criteriaNotes?.find((item) => item.category === criterion.category)?.note;
    return note ? { ...criterion, note: `${criterion.note} ${note.slice(0, 400)}`.trim() } : criterion;
  });

  const suggestions = [...buildSuggestions(matches, input.resumeText), ...(input.extraSuggestions ?? [])]
    .filter(
      (suggestion, index, all) =>
        all.findIndex((candidate) => candidate.title.toLowerCase() === suggestion.title.toLowerCase()) === index,
    )
    .slice(0, 10);

  return {
    version: 1,
    createdAt: (input.now ?? new Date()).toISOString(),
    score,
    matches,
    found,
    missing,
    criteria,
    suggestions,
    optimizedResume: input.optimizedResume ?? buildDeterministicResume(input.resumeText),
    stats: {
      jobChars: input.jobText.length,
      resumeChars: input.resumeText.length,
      requirementCount: matches.length,
      matchedCount: found.length,
    },
    integrity: [
      "Nenhuma experiência, cargo, empresa, data ou certificação foi criada.",
      "Ausência de evidência no texto não significa ausência da competência na vida real.",
      "O índice é uma estimativa interna de correspondência textual, não é uma nota oficial de ATS.",
      ...(input.extraIntegrity ?? []),
    ],
  };
}

export function analyzeDeterministic(input: {
  jobText: string;
  resumeText: string;
  now?: Date;
}): AnalysisResult {
  const requirements = extractRequirements(input.jobText);
  const matches = matchRequirements(requirements, input.resumeText);

  return finalizeAnalysis({
    jobText: input.jobText,
    resumeText: input.resumeText,
    matches,
    ...(input.now ? { now: input.now } : {}),
  });
}
