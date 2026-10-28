import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");

function collect(directory: string): string[] {
  const entries = readdirSync(directory);
  return entries.flatMap((entry) => {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) return collect(full);
    return /\.(ts|tsx|css|html)$/.test(entry) ? [full] : [];
  });
}

const files = [...collect(path.join(ROOT, "src")), path.join(ROOT, "index.html")].filter(
  (file) => !/\.test\.tsx?$/.test(file),
);

describe("segredos no código do navegador", () => {
  it("não contém chaves de API literais", () => {
    const offenders = files.filter((file) => /sk-[A-Za-z0-9]{16,}/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });

  it("não lê variáveis de ambiente privadas no frontend", () => {
    const offenders = files.filter((file) => {
      const source = readFileSync(file, "utf8");
      return source.includes("process.env") || /AI_API_KEY|AI_BASE_URL|OPENAI_API_KEY/.test(source);
    });
    expect(offenders).toEqual([]);
  });

  it("não usa variáveis VITE_* para segredos", () => {
    const offenders = files.filter((file) => /VITE_[A-Z_]*(KEY|TOKEN|SECRET|PASSWORD)/.test(readFileSync(file, "utf8")));
    expect(offenders).toEqual([]);
  });
});
