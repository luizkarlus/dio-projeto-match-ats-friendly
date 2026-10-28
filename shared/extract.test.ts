import { describe, expect, it } from "vitest";
import { detectPriority, estimateYearsOfExperience, extractRequirements } from "./extract";

const JOB = `Desenvolvedor Front-end Pleno — vaga fictícia.

Requisitos:
- Experiência mínima de 3 anos com desenvolvimento front-end.
- React e TypeScript obrigatórios.
- Ensino superior completo em Computação.
- Inglês intermediário para reuniões.
- Git e code review.

Desejável:
- Next.js e GraphQL.`;

describe("detectPriority", () => {
  it("reconhece obrigatório", () => {
    expect(detectPriority("React é obrigatório")).toBe("required");
    expect(detectPriority("Requisito: TypeScript")).toBe("required");
  });

  it("reconhece desejável", () => {
    expect(detectPriority("Next.js é desejável")).toBe("preferred");
    expect(detectPriority("Diferencial: GraphQL")).toBe("preferred");
  });

  it("não trata 'não obrigatório' como obrigatório", () => {
    expect(detectPriority("Inglês não obrigatório")).toBe("preferred");
  });

  it("deixa sem classificação quando o texto não indica", () => {
    expect(detectPriority("Trabalhamos com React")).toBe("unspecified");
  });
});

describe("extractRequirements", () => {
  const requirements = extractRequirements(JOB);
  const byLabel = (label: string) => requirements.find((item) => item.label === label);

  it("extrai tecnologias citadas", () => {
    expect(byLabel("React")).toBeDefined();
    expect(byLabel("TypeScript")).toBeDefined();
    expect(byLabel("GraphQL")).toBeDefined();
  });

  it("respeita obrigatório e desejável", () => {
    expect(byLabel("React")?.priority).toBe("required");
    expect(byLabel("Next.js")?.priority).toBe("preferred");
  });

  it("classifica buckets corretamente", () => {
    expect(byLabel("React")?.bucket).toBe("technical");
    expect(byLabel("Experiência de 3+ anos")?.bucket).toBe("experience");
    expect(byLabel("Ensino superior completo")?.bucket).toBe("education");
  });

  it("captura a faixa de anos exigida", () => {
    const years = requirements.find((item) => item.kind === "years");
    expect(years?.detail).toBe("3");
  });

  it("captura idioma e nível", () => {
    const language = requirements.find((item) => item.kind === "language");
    expect(language?.label).toBe("inglês intermediário");
    expect(language?.detail).toBe("2");
  });

  it("não transforma texto genérico em requisito", () => {
    expect(extractRequirements("Somos uma empresa de tecnologia com cultura de aprendizado.")).toEqual([]);
  });

  it("não duplica requisito repetido", () => {
    const duplicated = extractRequirements("React é obrigatório. React é desejável.");
    expect(duplicated.filter((item) => item.label === "React")).toHaveLength(1);
  });
});

describe("estimateYearsOfExperience", () => {
  it("usa faixa de datas", () => {
    expect(estimateYearsOfExperience("Desenvolvedora (2020 - 2024)")).toBe(4);
  });

  it("usa menção explícita", () => {
    expect(estimateYearsOfExperience("Atuo há 6 anos na área")).toBe(6);
  });

  it("retorna zero sem informação", () => {
    expect(estimateYearsOfExperience("Currículo sem datas")).toBe(0);
  });
});
