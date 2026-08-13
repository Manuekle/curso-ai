// server/llm.ts
// Enrutamiento de proveedor (#57): si existe OPENROUTER_API_KEY → OpenRouter,
// si no → OpenAI. Mismo SDK, cambia baseURL. Todo local menos estas llamadas.

import OpenAI from "openai";

export type Provider = "openai" | "openrouter";

export function provider(): Provider {
  if (process.env.OPENROUTER_API_KEY) return "openrouter";
  return "openai"; // sin key de ninguno → error claro por request (el server arranca igual)
}

let _client: OpenAI | null = null;

// Lazy init: el server arranca aunque falten las keys
export function client(): OpenAI {
  if (!_client) {
    _client =
      provider() === "openrouter"
        ? new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
          })
        : new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// Modelo de chat según proveedor (configurable por env)
export function chatModel(): string {
  return provider() === "openrouter"
    ? process.env.OPENROUTER_MODEL ?? "google/gemma-4-26b-a4b-it:free"
    : process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

// Modelo de embeddings según proveedor
// OpenRouter gratis: nvidia/nemotron-3-embed-1b:free (buscalo en openrouter.ai/models)
export function embeddingModel(): string {
  return provider() === "openrouter"
    ? process.env.OPENROUTER_EMBEDDING_MODEL ?? "nvidia/nemotron-3-embed-1b:free"
    : process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";
}

// Wrapper de chat: agrega `reasoning` solo si REASONING=true (algunos modelos gratis lo soportan)
// Los tipos del SDK OpenAI no incluyen `reasoning` → cast. El campo es passthrough de OpenRouter.
export async function chatCompletion(
  params: OpenAI.Chat.Completions.ChatCompletionCreateParams,
  options?: OpenAI.RequestOptions
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  // params tipados con stream?: opcional → el SDK devuelve unión; siempre usamos no-stream
  const create = (body: unknown): Promise<OpenAI.Chat.Completions.ChatCompletion> =>
    client().chat.completions.create(body as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming, options);

  if (process.env.REASONING === "true") {
    return create({ ...params, reasoning: { enabled: true } });
  }
  return create(params);
}