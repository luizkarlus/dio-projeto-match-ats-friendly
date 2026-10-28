import { AlertTriangle, CheckCircle2, CircleDashed, Info, Lightbulb, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BUCKET_LABELS } from "@shared/score";
import type { AnalysisResult, CriterionNote, RequirementMatch, Suggestion } from "@shared/types";
import { describeScore } from "@shared/score";

const LEVEL_META = {
  exact: { label: "Exato", tone: "success" as const },
  semantic: { label: "Semântico", tone: "violet" as const },
  partial: { label: "Parcial", tone: "warning" as const },
  missing: { label: "Sem evidência", tone: "warning" as const },
  unknown: { label: "Indeterminado", tone: "neutral" as const },
};

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function ScoreCard({ analysis }: { analysis: AnalysisResult }) {
  const band = describeScore(analysis.score.total);
  const buckets = analysis.score.buckets;

  return (
    <Card aria-labelledby="score-titulo">
      <CardHeader>
        <CardTitle id="score-titulo">Índice de compatibilidade</CardTitle>
        <CardDescription>{band.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
          <p className="text-5xl font-semibold leading-none tracking-tight tabular-nums text-navy">
            {analysis.score.total}
          </p>
          <p className="pb-1 text-sm text-muted">de 100 · {band.title}</p>
        </div>

        <Progress value={analysis.score.total} label="Índice de compatibilidade" />

        <div className="grid gap-3 sm:grid-cols-2">
          {buckets.map((bucket) => (
            <div key={bucket.bucket} className="rounded-lg border border-line bg-canvas/60 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-xs font-medium text-ink">{BUCKET_LABELS[bucket.bucket]}</p>
                <p className="text-xs tabular-nums text-muted">{bucket.weight}% do índice</p>
              </div>
              <div className="mt-2">
                <Progress value={bucket.coverage * 100} label={`Cobertura em ${BUCKET_LABELS[bucket.bucket]}`} />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {percent(bucket.coverage)} de cobertura · {bucket.exact + bucket.semantic} fortes ·{" "}
                {bucket.partial} parciais · {bucket.missing} ausentes
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-line bg-surface p-3">
          <p className="text-xs font-medium text-ink">Como o índice foi calculado</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{analysis.score.formula}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            É uma estimativa interna de correspondência textual e contextual. Não é nota oficial de ATS,
            não prevê decisão de recrutador e não garante aprovação.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RequirementItem({ match }: { match: RequirementMatch }) {
  const meta = LEVEL_META[match.level];

  return (
    <li className="rounded-lg border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-ink">{match.requirement.label}</span>
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {match.requirement.priority === "required" ? <Badge tone="outline">Obrigatório</Badge> : null}
        {match.requirement.priority === "preferred" ? <Badge tone="outline">Desejável</Badge> : null}
        {match.occurrences > 1 ? <Badge tone="neutral">{match.occurrences}× no texto</Badge> : null}
      </div>

      {match.evidence ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
          Evidência: “{match.evidence}”
        </p>
      ) : null}

      {match.rationale ? (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{match.rationale}</p>
      ) : null}
    </li>
  );
}

export function KeywordSection({ found, missing }: { found: RequirementMatch[]; missing: RequirementMatch[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card aria-labelledby="encontradas-titulo">
        <CardHeader>
          <CardTitle id="encontradas-titulo" className="flex items-center gap-2 text-base">
            <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
            Palavras-chave encontradas
            <Badge tone="success">{found.length}</Badge>
          </CardTitle>
          <CardDescription>
            Requisitos com evidência no currículo. “Exato” é o termo presente; “semântico” é a IA
            reconhecendo a mesma competência com outra palavra.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {found.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              <Info className="size-4 shrink-0" aria-hidden="true" />
              Nenhum requisito da vaga foi encontrado no currículo. Verifique se o texto colado está completo.
            </p>
          ) : (
            <ul className="space-y-2">
              {found.map((match) => (
                <RequirementItem key={match.requirement.id} match={match} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card aria-labelledby="ausentes-titulo">
        <CardHeader>
          <CardTitle id="ausentes-titulo" className="flex items-center gap-2 text-base">
            <SearchX className="size-5 text-warning" aria-hidden="true" />
            Sem evidência no texto
            <Badge tone="warning">{missing.length}</Badge>
          </CardTitle>
          <CardDescription>
            Ausência de evidência não significa ausência da competência. Inclua um item somente se
            ele corresponder à sua experiência real.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {missing.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg border border-dashed border-line p-4 text-sm text-muted">
              <Info className="size-4 shrink-0" aria-hidden="true" />
              Todos os requisitos identificados têm alguma evidência no currículo.
            </p>
          ) : (
            <ul className="space-y-2">
              {missing.map((match) => (
                <RequirementItem key={match.requirement.id} match={match} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CriteriaSection({ criteria }: { criteria: CriterionNote[] }) {
  return (
    <Card aria-labelledby="criterios-titulo">
      <CardHeader>
        <CardTitle id="criterios-titulo" className="flex items-center gap-2 text-base">
          <CircleDashed className="size-5 text-primary" aria-hidden="true" />
          Análise por critério
        </CardTitle>
        <CardDescription>
          Cada categoria mostra quantos requisitos têm evidência e o que ficou de fora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {criteria.length === 0 ? (
          <p className="text-sm text-muted">Nenhum critério pôde ser avaliado com o texto enviado.</p>
        ) : (
          <ul className="divide-y divide-line">
            {criteria.map((criterion) => (
              <li key={criterion.category} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:gap-6">
                <div className="flex min-w-52 items-center gap-2">
                  <span className="text-sm font-medium text-ink">{criterion.label}</span>
                  <Badge tone={criterion.matched === criterion.total ? "success" : "neutral"}>
                    {criterion.matched}/{criterion.total}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-muted">{criterion.note}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function SuggestionsSection({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <Card aria-labelledby="recomendacoes-titulo">
      <CardHeader>
        <CardTitle id="recomendacoes-titulo" className="flex items-center gap-2 text-base">
          <Lightbulb className="size-5 text-warning" aria-hidden="true" />
          Recomendações
        </CardTitle>
        <CardDescription>Sugestões de apresentação — não de conteúdo inventado.</CardDescription>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma recomendação adicional para este par de textos.</p>
        ) : (
          <ol className="space-y-4">
            {suggestions.map((suggestion) => (
              <li key={suggestion.title} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary-strong">
                  <AlertTriangle className="size-3.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{suggestion.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">{suggestion.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
