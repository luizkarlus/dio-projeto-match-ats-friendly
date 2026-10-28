const COMBINING_MARKS = /[\u0300-\u036f]/g;
const ALNUM_OR_TECH = /[\p{L}\p{N}+#]/u;

/**
 * Remove acentos preservando o comprimento por caractere (usado só para exibição
 * de termos e comparação, nunca para reescrever o texto do usuário).
 */
export function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(COMBINING_MARKS, "");
}

/**
 * Normalização canônica usada em toda comparação:
 * acento fora, caixa baixa, pontuação vira espaço, `+` e `#` ficam
 * (para `c++`, `c#`), espaços colapsados.
 */
export function normalize(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}+#\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(value: string): string[] {
  const normalized = normalize(value);
  return normalized.length === 0 ? [] : normalized.split(" ");
}

export function slugify(value: string): string {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export interface NormalizedText {
  text: string;
  /** Índice do caractere original que gerou cada caractere normalizado. */
  map: number[];
}

/**
 * Normaliza mantendo o mapa de posições, para recuperar o trecho original
 * como evidência sem alterar o texto do usuário.
 */
export function normalizeWithMap(input: string): NormalizedText {
  let text = "";
  const map: number[] = [];
  let pendingSpace = false;

  for (let i = 0; i < input.length; i += 1) {
    const raw = input[i] ?? "";
    const folded = stripDiacritics(raw);

    if (folded.length === 0) continue;

    const first = folded[0] ?? "";

    if (ALNUM_OR_TECH.test(first)) {
      if (pendingSpace && text.length > 0) {
        text += " ";
        map.push(i);
      }
      pendingSpace = false;
      for (const char of folded.toLowerCase()) {
        if (!ALNUM_OR_TECH.test(char)) continue;
        text += char;
        map.push(i);
      }
      continue;
    }

    if (text.length > 0) pendingSpace = true;
  }

  return { text, map };
}

export interface EvidenceHit {
  snippet: string;
  occurrences: number;
  firstIndex: number;
}

function isBoundary(char: string | undefined): boolean {
  return char === undefined || char === " ";
}

/**
 * Procura uma expressão no texto normalizado e devolve o trecho original
 * que a sustenta — nunca um texto reconstruído.
 */
export function findEvidence(haystack: string, phrase: string, radius = 90): EvidenceHit {
  const needle = normalize(phrase);
  if (needle.length === 0) return { snippet: "", occurrences: 0, firstIndex: -1 };

  const { text, map } = normalizeWithMap(haystack);
  const positions: number[] = [];

  let cursor = text.indexOf(needle);
  while (cursor !== -1) {
    const before = text[cursor - 1];
    const after = text[cursor + needle.length];
    if (isBoundary(before) && isBoundary(after)) positions.push(cursor);
    cursor = text.indexOf(needle, cursor + 1);
  }

  const first = positions[0];
  if (first === undefined) return { snippet: "", occurrences: 0, firstIndex: -1 };

  const startChar = map[first] ?? 0;
  const endChar = (map[first + needle.length - 1] ?? startChar) + 1;
  const snippet = haystack.slice(Math.max(0, startChar - radius), Math.min(haystack.length, endChar + radius));

  return {
    snippet: snippet.replace(/\s+/g, " ").trim(),
    occurrences: positions.length,
    firstIndex: startChar,
  };
}

/** Posição da primeira ocorrência da expressão com fronteira de palavra, ou -1. */
export function phraseIndex(normalizedText: string, phrase: string): number {
  const needle = normalize(phrase);
  if (needle.length === 0) return -1;

  let cursor = normalizedText.indexOf(needle);
  while (cursor !== -1) {
    const before = normalizedText[cursor - 1];
    const after = normalizedText[cursor + needle.length];
    if (isBoundary(before) && isBoundary(after)) return cursor;
    cursor = normalizedText.indexOf(needle, cursor + 1);
  }
  return -1;
}

/** Expressão completa, com fronteira de palavra, dentro de texto já normalizado. */
export function hasPhrase(normalizedText: string, phrase: string): boolean {
  return phraseIndex(normalizedText, phrase) !== -1;
}

/** True quando todos os tokens da expressão aparecem no texto normalizado. */
export function containsAllTokens(haystack: string, phrase: string): boolean {
  const { text } = normalizeWithMap(haystack);
  const tokens = tokenize(phrase);
  if (tokens.length === 0) return false;
  return tokens.every((token) => {
    const index = text.indexOf(` ${token} `);
    return index !== -1 || text.startsWith(`${token} `) || text.endsWith(` ${token}`) || text === token;
  });
}

export function countTokens(value: string): number {
  return tokenize(value).length;
}
