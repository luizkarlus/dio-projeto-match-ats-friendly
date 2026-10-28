import { useRef, useState } from "react";
import type { AnalyzeResponse } from "@shared/types";
import { AnalyzeForm, type FormStatus } from "@/components/AnalyzeForm";
import { HowItWorks, Intro, SiteFooter, SiteHeader } from "@/components/layout";
import { ResultsView } from "@/components/ResultsView";
import { SAMPLE_JOB, SAMPLE_RESUME } from "@/lib/samples";
import { AnalysisError, requestAnalysis } from "@/services/analyze";

export default function App() {
  const [jobText, setJobText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(): Promise<void> {
    setStatus("loading");
    setError(null);
    setResponse(null);
    setDraft("");

    try {
      const result = await requestAnalysis({ jobText, resumeText, useAI: true });
      setResponse(result);
      setDraft(result.analysis.optimizedResume);
      setStatus("done");
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
    } catch (caught) {
      setStatus("error");
      setError(
        caught instanceof AnalysisError
          ? caught.message
          : "Falha inesperada ao analisar. Verifique sua conexão e tente novamente.",
      );
    }
  }

  function handleReset(): void {
    setResponse(null);
    setDraft("");
    setError(null);
    setStatus("idle");
    document.getElementById("analisar")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    document.getElementById("vaga")?.focus();
  }

  function handleExample(field: "job" | "resume"): void {
    if (field === "job") setJobText(SAMPLE_JOB);
    else setResumeText(SAMPLE_RESUME);
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <a
        href="#analisar"
        className="sr-only rounded-md bg-navy px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Ir para o formulário de análise
      </a>

      <SiteHeader />

      <main>
        <Intro />

        <AnalyzeForm
          jobText={jobText}
          resumeText={resumeText}
          status={status}
          error={error}
          onChangeJob={setJobText}
          onChangeResume={setResumeText}
          onSubmit={() => {
            void handleSubmit();
          }}
          onUseExample={handleExample}
        />

        <div ref={resultsRef}>
          {response ? (
            <ResultsView
              response={response}
              draft={draft}
              onDraftChange={setDraft}
              onReset={handleReset}
            />
          ) : null}
        </div>

        <HowItWorks />
      </main>

      <SiteFooter />
    </div>
  );
}
