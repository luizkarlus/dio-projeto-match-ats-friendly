import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "../App";
import { analyzeDeterministic } from "@shared/analyze";
import type { AnalyzeResponse } from "@shared/types";
import { SAMPLE_JOB, SAMPLE_RESUME } from "../lib/samples";

function fillExamples() {
  const buttons = screen.getAllByRole("button", { name: /usar exemplo/i });
  return buttons as [HTMLElement, HTMLElement];
}

async function fillWithExamples(user: ReturnType<typeof userEvent.setup>) {
  const [jobExample, resumeExample] = fillExamples();
  await user.click(jobExample);
  await user.click(resumeExample);
}

function submitButton(): HTMLElement {
  return screen.getByRole("button", { name: /^analisar compatibilidade$/i });
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("formulário de análise", () => {
  it("impede a análise com os campos vazios", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(submitButton());

    expect(screen.getByText(/Cole a descrição da vaga/i)).toBeInTheDocument();
    expect(screen.getByText(/Cole o currículo/i)).toBeInTheDocument();
    expect(screen.queryByTestId("resultados")).not.toBeInTheDocument();
  });

  it("preenche os exemplos fictícios", async () => {
    const user = userEvent.setup();
    render(<App />);

    await fillWithExamples(user);

    expect(screen.getByLabelText(/descrição da vaga/i)).toHaveValue(SAMPLE_JOB);
    expect(screen.getByLabelText(/seu currículo/i)).toHaveValue(SAMPLE_RESUME);
  });

  it("mostra carregamento e desabilita o botão", async () => {
    vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(() => undefined)));
    const user = userEvent.setup();
    render(<App />);

    await fillWithExamples(user);
    await user.click(submitButton());

    expect(screen.getByText(/Analisando\.\.\./i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /analisando/i })).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /descrição da vaga/i })).toBeDisabled();
  });
});

describe("resultados", () => {
  it("analisa no navegador quando o servidor não responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<App />);

    await fillWithExamples(user);
    await user.click(submitButton());

    const results = await screen.findByTestId("resultados");
    expect(results).toBeInTheDocument();
    expect(screen.getByText(/Análise feita no navegador/i)).toBeInTheDocument();
    expect(screen.getByText(/Índice de compatibilidade/i)).toBeInTheDocument();
    expect(screen.getByText(/Palavras-chave encontradas/i)).toBeInTheDocument();
    expect(screen.getByText(/Sem evidência no texto/i)).toBeInTheDocument();
    expect(screen.getByText(/Seu currículo otimizado para ATS/i)).toBeInTheDocument();
  });

  it("exibe resultados vindos do servidor e o modo usado", async () => {
    const payload: AnalyzeResponse = {
      analysis: analyzeDeterministic({ jobText: SAMPLE_JOB, resumeText: SAMPLE_RESUME }),
      mode: "deterministic",
      warnings: ["IA não configurada neste ambiente."],
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse(payload)));
    const user = userEvent.setup();
    render(<App />);

    await fillWithExamples(user);
    await user.click(submitButton());

    await screen.findByTestId("resultados");
    expect(screen.getByText(/Modo determinístico/i)).toBeInTheDocument();
    expect(screen.getByText(/IA não configurada neste ambiente/i)).toBeInTheDocument();
  });

  it("mostra erro sem apagar os textos digitados", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ message: "Falha simulada no servidor." }, 500)),
    );
    const user = userEvent.setup();
    render(<App />);

    await fillWithExamples(user);
    await user.click(submitButton());

    expect(await screen.findByText(/Falha simulada no servidor/i)).toBeInTheDocument();
    expect(screen.queryByTestId("resultados")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/descrição da vaga/i)).toHaveValue(SAMPLE_JOB);
    expect(screen.getByLabelText(/seu currículo/i)).toHaveValue(SAMPLE_RESUME);
  });

  it("copia o texto editado, não o original", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<App />);

    await fillWithExamples(user);
    await user.click(submitButton());

    const editor = await screen.findByLabelText(/currículo otimizado, editável/i);
    await user.clear(editor);
    await user.type(editor, "Conteúdo editado pela pessoa candidata");
    await user.click(screen.getByRole("button", { name: /copiar currículo/i }));

    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toBe("Conteúdo editado pela pessoa candidata");
    });
    expect(await screen.findByText(/Currículo copiado com o texto atual/i)).toBeInTheDocument();
  });

  it("descarta resultados antigos ao iniciar nova análise", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const user = userEvent.setup();
    render(<App />);

    await fillWithExamples(user);
    await user.click(submitButton());
    await screen.findByTestId("resultados");

    await user.click(screen.getByRole("button", { name: /nova análise/i }));

    expect(screen.queryByTestId("resultados")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/descrição da vaga/i)).toHaveValue(SAMPLE_JOB);
  });
});
