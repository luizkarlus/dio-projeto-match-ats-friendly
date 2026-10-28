export type RequirementCategory =
  | "technical"
  | "behavioral"
  | "experience"
  | "education"
  | "tools"
  | "other";

export type ScoringBucket =
  | "technical"
  | "experience"
  | "mandatory"
  | "education"
  | "other";

export type Priority = "required" | "preferred" | "unspecified";

export type MatchLevel = "exact" | "semantic" | "partial" | "missing" | "unknown";

export type RequirementKind = "skill" | "years" | "education" | "language" | "license" | "generic";

export interface Requirement {
  id: string;
  label: string;
  /** Termos já normalizados usados na comparação textual. */
  terms: string[];
  category: RequirementCategory;
  bucket: ScoringBucket;
  priority: Priority;
  kind: RequirementKind;
  source: "dictionary" | "pattern" | "ai";
  detail?: string;
}

export interface RequirementMatch {
  requirement: Requirement;
  level: MatchLevel;
  evidence?: string;
  occurrences: number;
  rationale?: string;
  confidence: "high" | "medium" | "low";
}

export interface BucketScore {
  bucket: ScoringBucket;
  weight: number;
  coverage: number;
  exact: number;
  semantic: number;
  partial: number;
  missing: number;
  unknown: number;
  total: number;
}

export interface ScoreBreakdown {
  total: number;
  buckets: BucketScore[];
  redistributed: boolean;
  formula: string;
}

export interface CriterionNote {
  category: RequirementCategory;
  label: string;
  note: string;
  matched: number;
  total: number;
}

export type SuggestionKind = "structure" | "clarity" | "terminology" | "relevance";

export interface Suggestion {
  title: string;
  detail: string;
  kind: SuggestionKind;
}

export interface AnalysisStats {
  jobChars: number;
  resumeChars: number;
  requirementCount: number;
  matchedCount: number;
}

export interface AnalysisResult {
  version: 1;
  createdAt: string;
  score: ScoreBreakdown;
  matches: RequirementMatch[];
  found: RequirementMatch[];
  missing: RequirementMatch[];
  criteria: CriterionNote[];
  suggestions: Suggestion[];
  optimizedResume: string;
  stats: AnalysisStats;
  integrity: string[];
}

export type AnalysisMode = "ai" | "deterministic" | "offline";

export interface AnalyzeResponse {
  analysis: AnalysisResult;
  mode: AnalysisMode;
  aiModel?: string;
  warnings: string[];
}

export interface AnalyzeInput {
  jobText: string;
  resumeText: string;
  useAI?: boolean;
}

/** Trecho da resposta da IA que pode alterar a análise determinística. */
export interface AISemanticMatch {
  requirement: string;
  level: MatchLevel;
  evidence?: string | null;
  rationale?: string | null;
}

export interface AICriteriaNote {
  category: RequirementCategory;
  note: string;
}

export interface AIAnalysis {
  semanticMatches: AISemanticMatch[];
  criteriaNotes: AICriteriaNote[];
  suggestions: Suggestion[];
  optimizedResume: string;
  warnings: string[];
}
