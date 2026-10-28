import { ArrowRight, FileSearch, Lock, ShieldCheck, Sparkles, Target } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#topo" className="flex items-center gap-2.5 rounded-md">
          <span className="grid size-9 place-items-center rounded-lg bg-navy text-white">
            <FileSearch className="size-5" aria-hidden="true" />
          </span>
          <span className="text-base font-semibold tracking-tight text-navy">Match ATS</span>
        </a>

        <nav aria-label="Navegação principal" className="flex items-center gap-1">
          <a
            href="#analisar"
            className="rounded-md px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink sm:px-3"
          >
            Analisar currículo
          </a>
          <a
            href="#como-funciona"
            className="rounded-md px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-canvas hover:text-ink sm:px-3"
          >
            Como funciona
          </a>
        </nav>
      </div>
    </header>
  );
}

export function Intro() {
  return (
    <section id="topo" className="border-b border-line bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <Badge tone="primary" className="gap-1.5">
          <Sparkles className="size-3.5" aria-hidden="true" />
          Análise local, sem cadastro
        </Badge>

        <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Seu currículo, alinhado à oportunidade certa
        </h1>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Cole a vaga e o currículo. O Match ATS compara os dois textos, mostra o que está evidenciado,
          o que falta e gera uma versão mais fácil de ler por pessoas e por sistemas de triagem.
        </p>

        <Alert tone="warning" title="Integridade primeiro" className="mt-6 max-w-3xl">
          O Match ATS melhora a apresentação do seu currículo, mas nunca inventa experiências ou
          competências. Revise o resultado antes de enviá-lo.
        </Alert>

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Nada é salvo em banco de dados
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Lock className="size-4 text-success" aria-hidden="true" />
            Chave de IA nunca vai ao navegador
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Target className="size-4 text-success" aria-hidden="true" />
            Funciona sem IA, por regras objetivas
          </li>
        </ul>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: "1. Você cola os dois textos",
    detail:
      "A descrição completa da vaga e o conteúdo do currículo. Nada de upload: o texto fica no seu navegador até você enviar a análise.",
  },
  {
    title: "2. O motor compara requisito por requisito",
    detail:
      "Normalização de acentos e siglas, extração de requisitos objetivos e busca de evidência no currículo — com o trecho que sustenta cada correspondência.",
  },
  {
    title: "3. A IA entra só onde precisa",
    detail:
      "Quando configurada, ela interpreta equivalências semânticas e reescreve a apresentação. A nota continua sendo calculada pelo código, não pelo modelo.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h2 className="text-2xl font-semibold tracking-tight text-navy">Como funciona</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
        A pontuação combina cobertura textual e peso dos requisitos. É uma estimativa da ferramenta,
        não uma previsão de aprovação e não reproduz o algoritmo de nenhum ATS comercial.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle as="h3" className="text-base">
                {step.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted">{step.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h3" className="text-base">
              O que a ferramenta não faz
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-relaxed text-muted">
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Não garante aprovação nem simula um ATS específico.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Não cria experiências, métricas, cargos ou certificações.
              </li>
              <li className="flex gap-2">
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                Não armazena currículos nem mantém histórico entre sessões.
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h3" className="text-base">
              Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted">
              O texto é processado em memória. Se a IA estiver habilitada, apenas os dois textos
              são enviados ao provedor configurado por você, sem identificação e sem log do conteúdo.
              Ao iniciar uma nova análise, os resultados anteriores são descartados.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-8 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Match ATS · projeto de portfólio, uso local.</p>
        <p>Estimativa própria da ferramenta. Não é aconselhamento de carreira nem garantia de resultado.</p>
      </div>
    </footer>
  );
}
