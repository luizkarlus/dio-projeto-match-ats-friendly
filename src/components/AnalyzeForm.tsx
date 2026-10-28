import { useState } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { FieldHint, Label } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

const MAX_JOB = 20_000;
const MAX_RESUME = 30_000;
const MIN_JOB = 40;
const MIN_RESUME = 80;

export type FormStatus = "idle" | "loading" | "done" | "error";

interface AnalyzeFormProps {
  jobText: string;
  resumeText: string;
  status: FormStatus;
  error: string | null;
  onChangeJob: (value: string) => void;
  onChangeResume: (value: string) => void;
  onSubmit: () => void;
  onUseExample: (field: "job" | "resume") => void;
}

function countLabel(length: number, max: number): string {
  return `${length.toLocaleString("pt-BR")} / ${max.toLocaleString("pt-BR")} caracteres`;
}

export function AnalyzeForm({
  jobText,
  resumeText,
  status,
  error,
  onChangeJob,
  onChangeResume,
  onSubmit,
  onUseExample,
}: AnalyzeFormProps) {
  const [attempted, setAttempted] = useState(false);
  const loading = status === "loading";

  const jobError = jobText.trim().length < MIN_JOB ? `Cole a descrição da vaga (mínimo ${MIN_JOB} caracteres).` : null;
  const resumeError =
    resumeText.trim().length < MIN_RESUME ? `Cole o currículo (mínimo ${MIN_RESUME} caracteres).` : null;

  const showJobError = attempted && jobError !== null;
  const showResumeError = attempted && resumeError !== null;

  return (
    <section id="analisar" aria-labelledby="analisar-titulo" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="analisar-titulo" className="text-2xl font-semibold tracking-tight text-navy">
            Analisar compatibilidade
          </h2>
          <p className="mt-1 text-sm text-muted">
            Quanto mais completo o texto da vaga, melhor a comparação. Nada é enviado até você clicar em analisar.
          </p>
        </div>
      </div>

      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          if (jobError || resumeError) return;
          onSubmit();
        }}
        noValidate
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="vaga">Descrição da vaga</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-primary"
                  onClick={() => onUseExample("job")}
                  disabled={loading}
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Usar exemplo
                </Button>
              </div>
              <CardDescription>
                Cole o anúncio completo, incluindo requisitos e diferenciais.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                id="vaga"
                name="vaga"
                value={jobText}
                onChange={(event) => onChangeJob(event.target.value.slice(0, MAX_JOB))}
                placeholder="Cole aqui a descrição da vaga..."
                maxLength={MAX_JOB}
                disabled={loading}
                aria-invalid={showJobError}
                aria-describedby={showJobError ? "vaga-erro vaga-contador" : "vaga-contador"}
                required
              />
              <div className="flex items-start justify-between gap-3">
                <FieldHint id="vaga-erro" invalid className={showJobError ? "" : "sr-only"} role="alert">
                  {jobError ?? ""}
                </FieldHint>
                <FieldHint id="vaga-contador" className="ml-auto shrink-0 tabular-nums">
                  {countLabel(jobText.length, MAX_JOB)}
                </FieldHint>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label htmlFor="curriculo">Seu currículo</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs text-primary"
                  onClick={() => onUseExample("resume")}
                  disabled={loading}
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  Usar exemplo
                </Button>
              </div>
              <CardDescription>
                Cole o conteúdo em texto. Currículos em PDF ou imagem precisam ser convertidos antes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                id="curriculo"
                name="curriculo"
                value={resumeText}
                onChange={(event) => onChangeResume(event.target.value.slice(0, MAX_RESUME))}
                placeholder="Cole aqui o texto do seu currículo..."
                maxLength={MAX_RESUME}
                disabled={loading}
                aria-invalid={showResumeError}
                aria-describedby={showResumeError ? "curriculo-erro curriculo-contador" : "curriculo-contador"}
                required
              />
              <div className="flex items-start justify-between gap-3">
                <FieldHint id="curriculo-erro" invalid className={showResumeError ? "" : "sr-only"} role="alert">
                  {resumeError ?? ""}
                </FieldHint>
                <FieldHint id="curriculo-contador" className="ml-auto shrink-0 tabular-nums">
                  {countLabel(resumeText.length, MAX_RESUME)}
                </FieldHint>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-muted">
            Exemplos são fictícios. Seus textos são processados em memória e não ficam salvos.
          </p>
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Analisando...
              </>
            ) : (
              <>
                Analisar compatibilidade
                <ArrowRight className="size-4" aria-hidden="true" />
              </>
            )}
          </Button>
        </div>

        <div aria-live="polite" className="mt-4">
          {loading ? (
            <Alert tone="info">
              Comparando requisitos, calculando o índice e montando a versão otimizada. Isso pode levar alguns segundos.
            </Alert>
          ) : null}

          {error ? (
            <Alert tone="danger" title="Não foi possível concluir">
              {error} Seus textos continuam nos campos acima.
            </Alert>
          ) : null}
        </div>
      </form>
    </section>
  );
}
