import { Groq } from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type Provider = "openai" | "openrouter" | "groq" | "gemini";

export interface LLMConfig {
  provider: Provider;
  apiKey?: string;
  model?: string;
}

// Map provider to specific client instance
let _clients: Partial<Record<Provider, any>> = {};
let _lastKeys: Partial<Record<Provider, string>> = {};

function getClient(config: LLMConfig) {
  const { provider, apiKey } = config;
  const key = apiKey || (process.env[`${provider.toUpperCase()}_API_KEY`]);

  // Si ya tenemos cliente Y la key es la misma, reusar.
  if (_clients[provider] && _lastKeys[provider] === key) return _clients[provider];

  console.log(`Initializing new client for provider: ${provider}`);
  _lastKeys[provider] = key;

  switch (provider) {
    case "groq":
      _clients[provider] = new Groq({ apiKey: key });
      break;
    case "gemini":
      _clients[provider] = new GoogleGenerativeAI(key || "");
      break;
    case "openrouter":
      _clients[provider] = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: key,
      });
      break;
    case "openai":
    default:
      _clients[provider] = new OpenAI({ apiKey: key });
      break;
  }
  return _clients[provider];
}

export function getModel(config: LLMConfig): string {
  if (config.model) return config.model;
  switch (config.provider) {
    case "groq": return "openai/gpt-oss-120b";
    case "gemini": return "gemini-1.5-flash";
    case "openrouter": return process.env.OPENROUTER_MODEL ?? "google/gemma-4-26b-a4b-it:free";
    default: return process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  }
}


// Wrapper de chat unificado
export async function chatCompletion(
  config: LLMConfig,
  params: any
): Promise<any> {
  try {
    const client = getClient(config);
    const model = getModel(config);

    if (config.provider === "gemini") {
      const gemini = client.getGenerativeModel({ model });
      const result = await gemini.generateContent(params.messages[params.messages.length - 1].content);
      return { choices: [{ message: { content: result.response.text() } }] };
    }

    // OpenAI-compatible (OpenAI, Groq, OpenRouter)
    const body = { ...params, model };
    return await client.chat.completions.create(body);
  } catch (error: any) {
    console.error(`Error in chatCompletion (${config.provider}):`, error.message);
    throw new Error(`Error de LLM (${config.provider}): ${error.message}`);
  }
}

// Wrapper de embeddings unificado
export async function createEmbedding(
  config: LLMConfig,
  text: string
): Promise<number[]> {
  try {
    const client = getClient(config);

    if (config.provider === "gemini") {
      const model = client.getGenerativeModel({ model: "embedding-001" });
      const result = await model.embedContent(text);
      return result.embedding.values;
    }

    const model = config.provider === "groq" ? "text-embedding-3-small" : "text-embedding-3-small";
    const response = await client.embeddings.create({ model, input: text });
    return response.data[0].embedding;
  } catch (error: any) {
    console.error(`Error in createEmbedding (${config.provider}):`, error.message);
    throw new Error(`Error de Embedding (${config.provider}): ${error.message}`);
  }
}