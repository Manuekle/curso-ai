// server/extract.ts
// Extrae texto plano de archivos reales (#22, #23): txt/md/csv/json/djvu nativos,
// pdf (pdf-parse v2), docx (mammoth), xlsx (SheetJS). Devuelve "" si no soporta.

import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";

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