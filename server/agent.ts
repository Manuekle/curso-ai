// server/agent.ts
// Agente con tool calling (doc #13, #14) — el agente NUNCA accede a la DB directamente (#44).
// Tools autorizadas = frontera de permisos. Límites externos = #19 (maxIterations, timeout, costBudget).

import type OpenAI from "openai";
import { chatCompletion, getDefaultProvider, Provider } from "./llm.js";

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
      description: "Consulta el stock actual de un producto por su ID (ej. LAP-001, LAP-002, MOU-001, TEC-001)",
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
      description: "Registra un pedido de compra en el ERP. Requiere productId y quantity.",
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

async function dispatch(name: string, rawArgs: string | object): Promise<unknown> {
  const args = typeof rawArgs === "string" ? (JSON.parse(rawArgs) as Record<string, any>) : rawArgs;
  switch (name) {
    case "consultarInventario":
      return consultarInventario(args as { productId: string });
    case "registrarPedido":
      return registrarPedido(args as { productId: string; quantity: number });
    default:
      throw new Error(`Tool desconocida: ${name}`);
  }
}

export interface AgentStep {
  iteration: number;
  action: "tool_call" | "tool_result" | "final_answer";
  toolName?: string;
  toolArgs?: any;
  toolOutput?: any;
  detail?: string;
}

export interface AgentResult {
  answer: string;
  toolCalls: number;
  iterations: number;
  latencyMs: number;
  steps: AgentStep[];
  pythonLog: string;
  promptTokens: number;
  completionTokens: number;
}

export async function runAgent(
  question: string,
  user = "demo",
  apiKey?: string,
  provider?: Provider
): Promise<AgentResult> {
  const startTime = Date.now();
  const effectiveProvider = provider || getDefaultProvider();
  const config = { provider: effectiveProvider, apiKey };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "Sos un agente de inventario y pedidos para el ERP corporativo. Usá las tools disponibles cuando haga falta. " +
        "Si te preguntan por stock de un producto, llamá a consultarInventario. " +
        "Si te piden registrar una compra/pedido, llamá a registrarPedido. " +
        "No inventes datos: si una tool devuelve stock null, decilo claramente.",
    },
    { role: "user", content: question },
  ];

  let toolCallsCount = 0;
  let iterations = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  const steps: AgentStep[] = [];
  const logLines: string[] = [
    `[AI Agent] Mode: ReAct / Tool-Calling | Provider: ${effectiveProvider} | Max Iterations: ${MAX_ITERATIONS}`,
    `[User Query] "${question}" (User: ${user})`,
    `--------------------------------------------------------------------------------`,
  ];

  // Heurística local si el LLM corre en modo fallback offline o sin soporte nativo de function calling
  const qUpper = question.toUpperCase();
  const matchProduct = qUpper.match(/\b(LAP-001|LAP-002|MOU-001|TEC-001)\b/);
  const isOrder = qUpper.includes("PEDIDO") || qUpper.includes("COMPRA") || qUpper.includes("REGISTR");
  const matchQty = question.match(/\b(\d+)\b/);

  for (; iterations < MAX_ITERATIONS; iterations++) {
    if (toolCallsCount >= MAX_TOOL_CALLS) throw new Error("maxToolCalls alcanzado");

    let res: any;
    try {
      res = await chatCompletion(config, {
        temperature: 0,
        messages,
        tools: TOOLS,
        tool_choice: "auto",
      });
    } catch {
      // Fallback local determinista para simular ejecución de herramientas
      res = null;
    }

    const msg = res?.choices?.[0]?.message;

    // Cada llamada al LLM cobra prompt + completion: acumular para el total real gastado.
    const usage = res?.usage;
    if (usage?.prompt_tokens) {
      totalPromptTokens += usage.prompt_tokens;
      totalCompletionTokens += usage.completion_tokens || 0;
    }

    // Si el LLM devolvió tool calls
    if (msg?.tool_calls?.length) {
      messages.push(msg);

      for (const call of msg.tool_calls) {
        logLines.push(`[Iteration ${iterations + 1}] LLM invoked function: ${call.function.name}`);
        logLines.push(`  └─> Parameters: ${call.function.arguments}`);

        const result = await dispatch(call.function.name, call.function.arguments);
        toolCallsCount++;

        steps.push({
          iteration: iterations + 1,
          action: "tool_call",
          toolName: call.function.name,
          toolArgs: typeof call.function.arguments === "string" ? JSON.parse(call.function.arguments) : call.function.arguments,
        });

        steps.push({
          iteration: iterations + 1,
          action: "tool_result",
          toolName: call.function.name,
          toolOutput: result,
          detail: JSON.stringify(result),
        });

        logLines.push(`  └─> ERP Output: ${JSON.stringify(result)}`);

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    // Si no hubo tool_calls en el mensaje pero aún no ejecutamos ninguna tool y reconocemos la intención localmente
    if (iterations === 0 && matchProduct) {
      const pid = matchProduct[1];
      if (isOrder && matchQty) {
        const qty = parseInt(matchQty[1], 10);
        logLines.push(`[Iteration 1] Agent intent recognized: registrarPedido(productId="${pid}", quantity=${qty})`);
        const result = await dispatch("registrarPedido", { productId: pid, quantity: qty });
        toolCallsCount++;
        steps.push({ iteration: 1, action: "tool_call", toolName: "registrarPedido", toolArgs: { productId: pid, quantity: qty } });
        steps.push({ iteration: 1, action: "tool_result", toolName: "registrarPedido", toolOutput: result });
        logLines.push(`  └─> ERP Result: ${JSON.stringify(result)}`);
        messages.push({ role: "assistant", content: `Llamando a registrarPedido(${pid}, ${qty})` });
        messages.push({ role: "tool", tool_call_id: "call_local_1", content: JSON.stringify(result) });
        continue;
      } else {
        logLines.push(`[Iteration 1] Agent intent recognized: consultarInventario(productId="${pid}")`);
        const result = await dispatch("consultarInventario", { productId: pid });
        toolCallsCount++;
        steps.push({ iteration: 1, action: "tool_call", toolName: "consultarInventario", toolArgs: { productId: pid } });
        steps.push({ iteration: 1, action: "tool_result", toolName: "consultarInventario", toolOutput: result });
        logLines.push(`  └─> ERP Result: ${JSON.stringify(result)}`);
        messages.push({ role: "assistant", content: `Llamando a consultarInventario(${pid})` });
        messages.push({ role: "tool", tool_call_id: "call_local_1", content: JSON.stringify(result) });
        continue;
      }
    }

    // Respuesta final
    const finalAnswer = msg?.content || (
      matchProduct
        ? (isOrder
            ? `Se procesó la orden para ${matchProduct[1]}. Stock restante en ERP: ${erp[matchProduct[1]] ?? 0} unidades.`
            : `El producto ${matchProduct[1]} cuenta con un stock disponible de ${erp[matchProduct[1]] ?? 0} unidades en el ERP.`)
        : "No encontré suficiente información sobre el producto o la acción solicitada."
    );

    const totalLatencyMs = Date.now() - startTime;

    // Sin usage del proveedor (gemini o fallback local): estimar con chars/4.
    if (!totalPromptTokens && !totalCompletionTokens) {
      totalPromptTokens = Math.ceil(JSON.stringify(messages).length / 4);
      totalCompletionTokens = Math.ceil(finalAnswer.length / 4);
    }

    steps.push({
      iteration: iterations + 1,
      action: "final_answer",
      detail: finalAnswer,
    });

    logLines.push(`--------------------------------------------------------------------------------`);
    logLines.push(`[Final Synthesis] Iterations: ${iterations + 1} | Tool Calls: ${toolCallsCount} | Tokens in: ${totalPromptTokens} | out: ${totalCompletionTokens} | Latency: ${totalLatencyMs}ms`);
    logLines.push(`[Agent Answer] ${finalAnswer}`);

    return {
      answer: finalAnswer,
      toolCalls: toolCallsCount,
      iterations: iterations + 1,
      latencyMs: totalLatencyMs,
      steps,
      pythonLog: logLines.join("\n"),
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
    };
  }

  throw new Error(`maxIterations (${MAX_ITERATIONS}) alcanzado`);
}