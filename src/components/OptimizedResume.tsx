import { useState } from "react";
import { Check, Copy, Download, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface OptimizedResumeProps {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

type Feedback = { tone: "success" | "danger"; message: string } | null;

export function OptimizedResume({ value, onChange, onReset }: OptimizedResumeProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [exporting, setExporting] = useState(false);

  async function handleCopy(): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setFeedback({ tone: "success", message: "Currículo copiado com o texto atual do editor." });
    } catch {
      setFeedback({
        tone: "danger",
        message: "O navegador bloqueou a cópia. Selecione o texto e use Ctrl+C.",
      });
    }
  }

  async function handlePdf(): Promise<void> {
    setExporting(true);
    try {
      // jsPDF é carregado sob demanda para não pesar o bundle inicial.
      const { downloadResumePdf } = await import("@/lib/pdf");
      downloadResumePdf(value);
      setFeedback({ tone: "success", message: "PDF gerado a partir da versão editada." });
    } catch {
      setFeedback({ tone: "danger", message: "Não foi possível gerar o PDF. Tente novamente." });
    } finally {
      setExporting(false);
    }
  }

  return (
    <Card aria-labelledby="otimizado-titulo">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle id="otimizado-titulo">Seu currículo otimizado para ATS</CardTitle>
            <CardDescription>
              Texto linear, sem colunas ou tabelas. Edite à vontade: o PDF e a cópia usam exatamente
              o que está aqui.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="size-4" aria-hidden="true" />
              Copiar currículo
            </Button>
            <Button size="sm" onClick={handlePdf} disabled={exporting}>
              {exporting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              Baixar PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Nova análise
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <label htmlFor="curriculo-otimizado" className="sr-only">
          Currículo otimizado, editável
        </label>
        <textarea
          id="curriculo-otimizado"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck
          className="resume-preview min-h-[28rem] w-full resize-y rounded-lg border border-line bg-canvas/40 p-4 text-sm leading-relaxed text-ink focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          aria-describedby="otimizado-contador"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <p id="otimizado-contador" className="tabular-nums">
            {value.length.toLocaleString("pt-BR")} caracteres · editável
          </p>
          <p className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-success" aria-hidden="true" />
            Fatos preservados do original
          </p>
        </div>

        <div aria-live="polite">
          {feedback ? (
            <Alert tone={feedback.tone === "success" ? "success" : "danger"}>
              <span className="inline-flex items-center gap-1.5">
                {feedback.tone === "success" ? <Check className="size-3.5" aria-hidden="true" /> : null}
                {feedback.message}
              </span>
            </Alert>
          ) : null}
        </div>

        <p className="text-xs leading-relaxed text-muted">
          Revise antes de enviar. O texto parte do seu currículo e da vaga, mas a decisão final sobre
          o que é verdadeiro é sua.
        </p>
      </CardContent>
    </Card>
  );
}
