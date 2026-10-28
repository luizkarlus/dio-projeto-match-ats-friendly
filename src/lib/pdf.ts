import { jsPDF } from "jspdf";
import { parseResumeDocument } from "@shared/optimize";

const PAGE = {
  width: 210,
  height: 297,
  marginX: 16,
  marginTop: 18,
  marginBottom: 16,
};

const CONTENT_WIDTH = PAGE.width - PAGE.marginX * 2;
const BODY_SIZE = 9.6;
const LINE_HEIGHT = 4.6;
const INK: [number, number, number] = [15, 23, 42];
const NAVY: [number, number, number] = [23, 37, 84];
const MUTED: [number, number, number] = [100, 116, 139];
const LINE: [number, number, number] = [226, 232, 240];

/**
 * Gera o PDF a partir do texto atual do editor.
 * Texto puro, A4, uma coluna, Helvetica (acentos do pt-BR), sem imagens.
 */
export function buildResumePdf(text: string): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const document = parseResumeDocument(text);
  let y = PAGE.marginTop;

  const ensureSpace = (needed: number) => {
    if (y + needed <= PAGE.height - PAGE.marginBottom) return;
    doc.addPage();
    y = PAGE.marginTop;
  };

  if (document.name) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(...NAVY);
    doc.text(document.name, PAGE.width / 2, y, { align: "center" });
    y += 7;
  }

  if (document.contact.length > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const contactLines = doc.splitTextToSize(document.contact.join("  ·  "), CONTENT_WIDTH) as string[];
    for (const contactLine of contactLines) {
      ensureSpace(LINE_HEIGHT);
      doc.text(contactLine, PAGE.width / 2, y, { align: "center" });
      y += 4.2;
    }
  }

  y += 2;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
  y += 7;

  for (const section of document.sections) {
    ensureSpace(14);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.2);
    doc.setTextColor(...NAVY);
    doc.setCharSpace(0.35);
    doc.text(section.title.toUpperCase(), PAGE.marginX, y);
    doc.setCharSpace(0);

    y += 2.4;
    doc.setDrawColor(...LINE);
    doc.line(PAGE.marginX, y, PAGE.width - PAGE.marginX, y);
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(BODY_SIZE);
    doc.setTextColor(...INK);

    for (const rawLine of section.lines) {
      const line = rawLine.trim();

      if (line.length === 0) {
        y += 2.2;
        continue;
      }

      const isBullet = /^[-–•*]\s/.test(line);
      const content = isBullet ? line.slice(2).trim() : line;
      const indent = isBullet ? 4 : 0;
      const chunks = doc.splitTextToSize(content, CONTENT_WIDTH - indent) as string[];

      chunks.forEach((chunk, index) => {
        ensureSpace(LINE_HEIGHT);
        if (isBullet && index === 0) {
          doc.text("•", PAGE.marginX + 1, y);
        }
        doc.text(chunk, PAGE.marginX + indent, y);
        y += LINE_HEIGHT;
      });

      y += 1.2;
    }

    y += 3;
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`${page}/${pages}`, PAGE.width - PAGE.marginX, PAGE.height - 8, { align: "right" });
  }

  return doc;
}

export function downloadResumePdf(text: string, filename = "curriculo-match-ats.pdf"): void {
  buildResumePdf(text).save(filename);
}
