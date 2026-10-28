import { ShieldCheck } from "lucide-react";
import type { AnalyzeResponse } from "@shared/types";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptimizedResume } from "@/components/OptimizedResume";
import { CriteriaSection, KeywordSection, ScoreCard, SuggestionsSection } from "@/components/results";
import { formatDateTime } from "@/lib/format";

interface ResultsViewProps {
  response: AnalyzeResponse;
  draft: string;
  onDraftChange: (value: string) => void;
  onReset: () => void;
}

export function ResultsView({ response, draft, onDraftChange, onReset }: ResultsViewProps) {
  const { analysis, mode, aiModel, warnings } = response;

  const banner =
    mode === "ai"
      ? {
          tone: "success" as const,
          title: "Análise com IA generativa",
          text: `Modelo: ${aiModel ?? "configurado"}. A IA interpretou equivalências e sugeriu a reescrita; a nota foi calculada pelo código. Revise o texto antes de enviar.`,
        }
      : mode === "offline"
        ? {
            tone: "warning" as const,
            title: "Análise feita no navegador",
            text: "O servidor local não respondeu. O resultado usa apenas correspondência textual e regras objetivas, sem IA.",
          }
        : {
            tone: "info" as const,
            title: "Modo determinístico",
            text: "A IA não está configurada ou foi desativada. A análise usa correspondência textual, dicionário de competências e regras objetivas.",
          };

  return (
    <section
      aria-labelledby="resultados-titulo"
      className="mx-auto max-w-5xl px-4 pb-16 sm:px-6"
      data-testid="resultados"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="resultados-titulo" className="text-2xl font-semibold tracking-tight text-navy">
            Resultado da análise
          </h2>
          <p className="mt-1 text-xs text-muted">
            {analysis.stats.requirementCount} requisitos identificados ·{" "}
            {analysis.stats.matchedCount} com evidência · gerado em {formatDateTime(analysis.createdAt)}
          </p>
        </div>
        <Badge tone={mode === "ai" ? "violet" : "neutral"}>
          {mode === "ai" ? "com IA" : mode === "offline" ? "offline" : "determinístico"}
        </Badge>
      </div>

      <div className="space-y-3">
        <Alert tone={banner.tone} title={banner.title}>
          {banner.text}
        </Alert>

        {warnings.length > 0 ? (
          <Alert tone="warning" title="Observações desta execução">
            <ul className="list-disc space-y-1 pl-4">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Alert>
        ) : null}
      </div>

      <div className="mt-4 space-y-4">
        <ScoreCard analysis={analysis} />
        <KeywordSection found={analysis.found} missing={analysis.missing} />
        <CriteriaSection criteria={analysis.criteria} />
        <SuggestionsSection suggestions={analysis.suggestions} />

        <OptimizedResume value={draft} onChange={onDraftChange} onReset={onReset} />

        <Card>
          <CardHeader>
            <CardTitle as="h3" className="flex items-center gap-2 text-base">
              <ShieldCheck className="size-5 text-success" aria-hidden="true" />
              Compromissos desta análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm leading-relaxed text-muted">
              {analysis.integrity.map((item) => (
                <li key={item} className="flex gap-2">
                  <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-success" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
