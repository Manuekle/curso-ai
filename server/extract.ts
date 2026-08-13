// server/extract.ts
// Extrae texto plano de archivos reales (#22, #23): txt/md/csv/json/djvu nativos,
// pdf (pdf-parse v2), docx (mammoth), xlsx (SheetJS). Devuelve "" si no soporta.

import mammoth from "mammoth";
import * as XLSX from "xlsx";

// pdfjs-dist usa DOMMatrix en el top-level de su build; Node < 26 no lo define.
// Polifill mínimo (identidad) suficiente para la extracción de texto.
function ensureDomMatrix() {
  if (!(globalThis as Record<string, unknown>).DOMMatrix) {
    (globalThis as Record<string, unknown>).DOMMatrix = class DOMMatrix {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;
      multiplySelf() {
        return this;
      }
      translateSelf(x: number, y: number) {
        this.e += x;
        this.f += y;
        return this;
      }
      scaleSelf() {
        return this;
      }
      invertSelf() {
        return this;
      }
    };
  }
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split(".").pop() ?? "";

  switch (ext) {
    case "txt":
    case "md":
    case "markdown":
    case "csv":
    case "json":
    case "html":
    case "htm":
    case "log":
      return buffer.toString("utf-8");

    case "pdf": {
      // Import dinámico: evita que pdfjs-dist se evalúe al arrancar el proceso
      // (DOMMatrix ausente en Node 24 de las lambdas)
      ensureDomMatrix();
      const { PDFParse } = await import("pdf-parse");
      const pdf = new PDFParse({ data: buffer });
      try {
        const { text } = await pdf.getText();
        return text;
      } finally {
        await pdf.destroy();
      }
    }

    case "docx":
    case "doc": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    case "xlsx":
    case "xls": {
      const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const rows: string[] = [];
      for (const sheetName of wb.SheetNames) {
        const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]!);
        rows.push(`[Hoja: ${sheetName}]\n${csv}`);
      }
      return rows.join("\n\n");
    }

    default:
      return "";
  }
}