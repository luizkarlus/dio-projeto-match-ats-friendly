import { describe, expect, it } from "vitest";
import { findEvidence, hasPhrase, normalize, normalizeWithMap, tokenize } from "./normalize";

describe("normalize", () => {
  it("remove acentos e preserva sinais técnicos", () => {
    expect(normalize("Programação em C# e C++!")).toBe("programacao em c# e c++");
  });

  it("trata versões com ponto como termos separados", () => {
    expect(normalize("  Node.js   e   React.JS ")).toBe("node js e react js");
  });

  it("colapsa pontuação e espaços", () => {
    expect(normalize("Ação, coração; pão — 100%")).toBe("acao coracao pao 100");
  });

  it("tokeniza texto vazio sem gerar token fantasma", () => {
    expect(tokenize("   ")).toEqual([]);
    expect(tokenize("React e TypeScript")).toEqual(["react", "e", "typescript"]);
  });
});

describe("hasPhrase", () => {
  it("não confunde palavra parecida com correspondência", () => {
    expect(hasPhrase(normalize("conhecimento em javascript"), "java")).toBe(false);
  });

  it("reconhece sigla e versão com ponto", () => {
    expect(hasPhrase(normalize("trabalho com node.js"), "node.js")).toBe(true);
    expect(hasPhrase(normalize("trabalho com js"), "js")).toBe(true);
  });

  it("não encontra termo ausente", () => {
    expect(hasPhrase(normalize("curriculo sem a tecnologia"), "kubernetes")).toBe(false);
  });
});

describe("normalizeWithMap", () => {
  it("mantém um índice original para cada caractere normalizado", () => {
    const { text, map } = normalizeWithMap("Ação rápida");
    expect(text).toBe("acao rapida");
    expect(map).toHaveLength(text.length);
    expect(map[0]).toBe(0);
  });
});

describe("findEvidence", () => {
  const resume =
    "Atuei com React e TypeScript na Fintech Aurora por 3 anos. Também fiz testes com Vitest e Testing Library.";

  it("devolve o trecho original, com acentuação preservada", () => {
    const hit = findEvidence(resume, "typescript");
    expect(hit.occurrences).toBe(1);
    expect(hit.snippet).toContain("TypeScript");
  });

  it("conta ocorrências múltiplas", () => {
    const hit = findEvidence("React, React e React.", "react");
    expect(hit.occurrences).toBe(3);
  });

  it("não encontra termo que só aparece como parte de outro", () => {
    const hit = findEvidence("Conhecimento em javascript avançado", "java");
    expect(hit.occurrences).toBe(0);
  });

  it("retorna vazio quando não há correspondência", () => {
    const hit = findEvidence(resume, "kubernetes");
    expect(hit).toMatchObject({ snippet: "", occurrences: 0, firstIndex: -1 });
  });
});
