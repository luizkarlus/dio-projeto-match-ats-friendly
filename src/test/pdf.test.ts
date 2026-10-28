import { describe, expect, it } from "vitest";
import { buildResumePdf } from "../lib/pdf";
import { SAMPLE_RESUME } from "../lib/samples";
import { cleanResumeText, parseResumeDocument } from "@shared/optimize";

describe("parseResumeDocument", () => {
  const document = parseResumeDocument(SAMPLE_RESUME);

  it("identifica nome e contato", () => {
    expect(document.name).toBe("Ana Ribeiro");
    expect(document.contact[0]).toContain("ana.ribeiro@exemplo.com");
  });

  it("reconhece as seções convencionais", () => {
    const titles = document.sections.map((section) => section.title);
    expect(titles).toEqual([
      "Resumo Profissional",
      "Experiência Profissional",
      "Formação Acadêmica",
      "Competências",
      "Certificações",
    ]);
  });

  it("preserva empresas, cargos e datas do original", () => {
    const experience = document.sections.find((section) => section.title === "Experiência Profissional");
    const text = experience?.lines.join("\n") ?? "";
    expect(text).toContain("Fintech Aurora");
    expect(text).toContain("(2022 - atual)");
    expect(text).toContain("Agência Norte");
  });

  it("não descarta conteúdo sem seção reconhecida", () => {
    const parsed = parseResumeDocument("Nome\nnome@exemplo.com\n\nTexto livre sem título de seção.");
    expect(parsed.sections[0]?.title).toBe("Resumo Profissional");
    expect(parsed.sections[0]?.lines.join(" ")).toContain("Texto livre");
  });
});

describe("cleanResumeText", () => {
  it("normaliza marcadores e espaços sem alterar palavras", () => {
    const cleaned = cleanResumeText("• React\r\n• TypeScript\t avançado\r\n\r\n\r\nFim");
    expect(cleaned).toContain("- React");
    expect(cleaned).toContain("TypeScript  avançado");
    expect(cleaned).not.toContain("\r");
    expect(cleaned).not.toContain("\n\n\n");
  });
});

describe("buildResumePdf", () => {
  const raw = buildResumePdf(SAMPLE_RESUME).output();

  it("gera um PDF válido com texto selecionável", () => {
    expect(raw.startsWith("%PDF-")).toBe(true);
    expect(raw.length).toBeGreaterThan(1_000);
    expect(raw).toContain("Ana Ribeiro");
  });

  it("preserva acentos do português", () => {
    expect(raw).toContain("EXPERIÊNCIA PROFISSIONAL");
    expect(raw).toContain("FORMAÇÃO ACADÊMICA");
    expect(raw).toContain("CERTIFICAÇÕES");
  });

  it("usa uma única página para um currículo curto", () => {
    expect(buildResumePdf(SAMPLE_RESUME).getNumberOfPages()).toBe(1);
  });

  it("quebra em páginas adicionais quando o texto é longo", () => {
    const longResume = cleanResumeText(
      [
        "Pessoa Exemplo",
        "pessoa@exemplo.com · (11) 90000-0000",
        "EXPERIÊNCIA PROFISSIONAL",
        ...Array.from(
          { length: 40 },
          (_, index) => `Cargo ${index + 1} — Empresa Exemplo (20${10 + (index % 10)} - 20${11 + (index % 10)})\n- Responsabilidade detalhada número ${index + 1} com descrição suficientemente longa para ocupar mais de uma linha no documento exportado.`,
        ),
      ].join("\n\n"),
    );

    expect(buildResumePdf(longResume).getNumberOfPages()).toBeGreaterThan(1);
  });

  it("exporta exatamente o texto editado", () => {
    const edited = "Nome Editado\neditado@exemplo.com\n\nRESUMO PROFISSIONAL\nTexto revisado pela pessoa candidata.";
    const output = buildResumePdf(edited).output();

    expect(output).toContain("Nome Editado");
    expect(output).toContain("Texto revisado pela pessoa candidata");
    expect(output).not.toContain("Ana Ribeiro");
  });
});
