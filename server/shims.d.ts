// Tipos mínimos para mammoth (sin @types oficial).
declare module "mammoth" {
  interface ExtractResult {
    value: string;
    messages: unknown[];
  }
  function extractRawText(input: { buffer: Buffer }): Promise<ExtractResult>;
  const mammoth: { extractRawText: typeof extractRawText };
  export default mammoth;
}