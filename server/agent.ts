// server/agent.ts
// Agente con tool calling (doc #13, #14) — el agente NUNCA accede a la DB directamente (#44).
// Tools autorizadas = frontera de permisos. Límites externos = #19 (maxIterations, timeout, costBudget).

import type OpenAI from "openai";
import { chatCompletion, Provider } from "./llm.js";

export const MAX_ITERATIONS = 4;
export const MAX_TOOL_CALLS = 6;
export const TIMEOUT_MS = 30_000;

// ── "ERP" simulado en memoria (en prod esto sería la API real del ERP) ──
export const erp: Record<string, number> = {
  "LAP-001": 5,
  "LAP-002": 42,
  "MOU-001": 3,
  "TEC-001": 120,
};

// Tool #1 — SOLO lectura: consulta inventario
async function consultarInventario(args: { productId: string }): Promise<{ productId: string; stock: number | null }> {
  return { productId: args.productId, stock: erp[args.productId] ?? null };
}

// Tool #2 — ESCRITURA: registrar pedido (se autoriza aparte: rol/política)
async function registrarPedido(args: { productId: string; quantity: number }): Promise<{ ok: boolean; message: string }> {
  const stock = erp[args.productId];
  if (stock === undefined) return { ok: false, message: "Producto inexistente" };
  if (args.quantity > stock) return { ok: false, message: `Stock insuficiente (hay ${stock})` };
  erp[args.productId] = stock - args.quantity;
  return { ok: true, message: `Pedido de ${args.quantity} registrado. Stock restante: ${erp[args.productId]}` };
}

// Registro de tools → el modelo solo puede llamar a estas (#14)
const TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "consultarInventario",
      description: "Consulta el stock actual de un producto por su ID",
      parameters: {
        type: "object",
        properties: { productId: { type: "string", description: "ID del producto, ej. LAP-001" } },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "registrarPedido",
      description: "Registra un pedido de compra. Requiere permiso de escritura.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "number" },
        },
        required: ["productId", "quantity"],
      },
    },
  },
];

async function dispatch(name: string, rawArgs: string): Promise<unknown> {
  const args = JSON.parse(rawArgs) as Record<string, never>;
  switch (name) {
    case "consultarInventario":
      return consultarInventario(args as unknown as { productId: string });
    case "registrarPedido":
      return registrarPedido(args as unknown as { productId: string; quantity: number });
    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
}

export interface AgentResult {
  answer: string;
  toolCalls: number;
  iterations: number;
}

export async function runAgent(question: string, user = "demo", apiKey?: string, provider: Provider = "openai"): Promise<AgentResult> {
  const config = { provider, apiKey };
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Sos un agente de inventario. Usá las tools disponibles cuando haga falta. " +
        "No inventes datos: si una tool devuelve stock null, decilo. " +
        "Regla crítica: si no hay evidencia suficiente, respondé 'No encontré suficiente información para responder con seguridad.'",
    },
    { role: "user", content: question },
  ];

  let toolCalls = 0;
  let iterations = 0;

  for (; iterations < MAX_ITERATIONS; iterations++) {
    if (toolCalls >= MAX_TOOL_CALLS) throw new Error("maxToolCalls alcanzado");

    const res = await chatCompletion(
      config,
      {
        temperature: 0, // #5 baja temperatura → consistencia
        messages,
        tools: TOOLS,
        tool_choice: "auto", // el modelo decide si llama una tool o responde
      }
    );

    const msg = res.choices[0].message;
    messages.push(msg); // historial completo de vuelta al modelo

    // Sin tool_calls → respuesta final
    if (!msg.tool_calls?.length) {
      return { answer: msg.content ?? "", toolCalls, iterations: iterations + 1 };
    }

    for (const call of msg.tool_calls) {
      const result = await dispatch(call.function.name, call.function.arguments);
      toolCalls++;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result), // resultado vuelve como mensaje tool
      });
    }
  }

  throw new Error(`maxIterations (${MAX_ITERATIONS}) alcanzado`);
}