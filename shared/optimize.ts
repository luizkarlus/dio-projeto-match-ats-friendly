import { normalize } from "./normalize";

export interface ResumeSection {
  title: string;
  lines: string[];
}

export interface ResumeDocument {
  name: string;
  contact: string[];
  sections: ResumeSection[];
}

const HEADINGS: Array<{ pattern: RegExp; title: string; order: number }> = [
  { pattern: /^(resumo|sobre|perfil|objetivo|summary|profile)/, title: "Resumo Profissional", order: 1 },
  {
    pattern: /^(experiencia|historico profissional|trajetoria|experience|atuacao)/,
    title: "Experiência Profissional",
    order: 2,
  },
  { pattern: /^(formacao|educacao|academico|education)/, title: "Formação Acadêmica", order: 3 },
  {
    pattern: /^(competencia|habilidade|conhecimento|skills|tecnologia|ferramenta)/,
    title: "Competências",
    order: 4,
  },
  { pattern: /^(certifica|curso|certification|licenca)/, title: "Certificações", order: 5 },
  { pattern: /^(idioma|language)/, title: "Idiomas", order: 6 },
  { pattern: /^(projeto|portfolio|project)/, title: "Projetos", order: 7 },
  { pattern: /^(conquista|premio|publicacao|voluntariado|atividade)/, title: "Outros", order: 8 },
];

const CONTACT_PATTERN = /@|https?:\/\/|www\.|linkedin|github|\(\d{2}\)|\+?\d{2}\s?\d{4,5}[-\s]?\d{4}/i;

/** Remove elementos que atrapalham extração de texto, sem alterar conteúdo. */
export function cleanResumeText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/[\t]+/g, " ")
    .replace(/^[\s]*[•●▪‣◦*–—][\s]*/gm, "- ")
    .replace(/[ \t]+$/gm, "")
    .replace(/\|/g, " · ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function headingFor(line: string): { title: string; order: number } | null {
  const raw = line
    .replace(/^[-–—•●▪*]\s*/, "")
    .replace(/[:：]\s*$/, "")
    .trim();

  if (raw.length === 0 || raw.length > 60) return null;
  if (raw.split(/\s+/).length > 6) return null;
  if (CONTACT_PATTERN.test(raw)) return null;

  const normalized = normalize(raw);
  const heading = HEADINGS.find((candidate) => candidate.pattern.test(normalized));
  return heading ? { title: heading.title, order: heading.order } : null;
}

/**
 * Estrutura o texto em nome, contato e seções — usado pela pré-visualização e
 * pelo PDF. Não reescreve nenhuma frase do usuário.
 */
export function parseResumeDocument(text: string): ResumeDocument {
  const lines = cleanResumeText(text).split("\n");
  const contact: string[] = [];
  const sections: ResumeSection[] = [];
  let name = "";
  let current: ResumeSection | null = null;
  let preSection: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const heading = line.length > 0 ? headingFor(line) : null;

    if (line.length === 0) {
      if (current && current.lines.length > 0 && current.lines[current.lines.length - 1] !== "") {
        current.lines.push("");
      }
      continue;
    }

    if (!name && !heading && !CONTACT_PATTERN.test(line) && line.length <= 60) {
      name = line;
      continue;
    }

    if (heading) {
      if (preSection.some((entry) => entry.trim().length > 0)) {
        sections.push({ title: "Resumo Profissional", lines: [...preSection] });
        preSection = [];
      }
      current = { title: heading.title, lines: [] };
      sections.push(current);
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else if (CONTACT_PATTERN.test(line)) {
      contact.push(line);
    } else {
      preSection.push(line);
    }
  }

  if (preSection.some((entry) => entry.trim().length > 0)) {
    sections.push({ title: "Resumo Profissional", lines: preSection });
  }

  return {
    name,
    contact,
    sections: sections
      .map((section) => ({
        title: section.title,
        lines: section.lines.filter((line, index, all) => !(line === "" && all[index - 1] === "")),
      }))
      .filter((section) => section.lines.some((line) => line.trim().length > 0)),
  };
}

function sectionOrder(title: string): number {
  return HEADINGS.find((heading) => heading.title === title)?.order ?? 99;
}

function renderDocument(document: ResumeDocument): string {
  const blocks: string[] = [];
  if (document.name) blocks.push(document.name);
  if (document.contact.length > 0) blocks.push(document.contact.join(" · "));

  const ordered = [...document.sections].sort((a, b) => sectionOrder(a.title) - sectionOrder(b.title));

  for (const section of ordered) {
    const body = section.lines.join("\n").trim();
    if (body.length === 0) continue;
    blocks.push(`${section.title.toUpperCase()}\n${body}`);
  }

  return blocks.join("\n\n").trim();
}

/**
 * Versão "limpa" sem IA: mesma informação, seções em ordem convencional,
 * sem colunas, tabelas ou enfeite que confunda extração.
 */
export function buildDeterministicResume(text: string): string {
  return renderDocument(parseResumeDocument(text));
}

/** Normaliza a saída da IA com as mesmas regras, sem reescrever conteúdo. */
export function normalizeOptimizedResume(text: string, fallback: string): string {
  const cleaned = cleanResumeText(text);
  if (cleaned.length < 80) return fallback;
  return cleaned;
}
