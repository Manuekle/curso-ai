# Chatbot Local — diseño

Fecha: 2026-08-13
Estado: aprobado (usuario)

## Problema

El curso tiene RAG server-side (`/api/rag/*`). Se quiere un chatbot que corra 100% en el navegador con persistencia en localStorage: el usuario sube archivos md/txt, sus vectores viven en localStorage, y el chat responde sobre ellos sin depender del server para el pipeline.

## Enfoque elegido (A, aprobado)

100% cliente: navegador llama directo a proveedores (OpenAI / OpenRouter / Groq / Gemini) con las API keys ya guardadas en localStorage (`useApiKeys`). Sin key o error → fallback local TF-IDF (mismo algoritmo que `server/llm.ts: generateLocalEmbedding`). El server no se toca excepto para importar la base vectorial existente.

## Fuentes de datos (aprobadas)

1. **Upload en browser**: md/txt únicamente (sin PDF por ahora). Chunking 800 chars / 100 overlap (mismo que `server/rag.ts: chunkText`). Embeddings con proveedor activo o fallback local.
2. **Importar base vectorial del server**: botón que hace GET `/api/rag/store` y guarda los docs (id, text, owner, vector) en localStorage.

## Arquitectura

### `frontend/src/lib/localRag.ts` (nuevo)

- `chunkText(text, size=800, overlap=100)` — mismo algoritmo server.
- `cosine(a, b)` — misma implementación server.
- `generateLocalEmbedding(text, dim=1536)` — port cliente del TF-IDF + subword n-grams de `server/llm.ts`.
- `embedTexts(texts, apiKey, provider)` — fetch directo:
  - openai: `POST https://api.openai.com/v1/embeddings` (model `text-embedding-3-small`)
  - openrouter: `POST https://openrouter.ai/api/v1/embeddings` (`nvidia/nemotron-3-embed-1b:free`)
  - groq: sin API de embeddings → usa openrouter/openai con la key de groq si no hay otra (misma lógica server)
  - gemini: `POST https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent`
  - fallback: `generateLocalEmbedding`
- `chat(messages, apiKey, provider)` — fetch directo chat completions:
  - openai/openrouter/groq: formato OpenAI-compatible (`/chat/completions`, modelos por defecto del server)
  - gemini: `:generateContent` con system instruction
  - error sin key válida → throw con mensaje claro
- Store localStorage: key `chatbot-store`, shape `Array<{ id, text, owner, vector }>`
  - `loadStore()`, `saveStore(docs)`, `clearStore()`
- `indexText(name, text, ...)` → chunk → embed → merge a store + persistir
- `importFromServer()` → GET `/api/rag/store` → mapear y persistir (ids ya vienen con prefijo `doc:chunk`)
- `askLocal(question, docs, ...)` → embed pregunta → cosine top-K (umbral 0.20, k=4) → devuelve hits con score y snippets

### `frontend/src/pages/ChatbotPage.tsx` (nuevo)

- Secciones:
  - **Datos**: drag&drop + input file (`accept=".md,.txt"`), botón "Importar del server", lista de docs indexados (id, chars), botón limpiar.
  - **Chat**: historial de mensajes (`chatbot-history` en localStorage), input + send, respuesta con fuentes citadas `[fuente: ...]`.
  - **Stats**: total docs, dimensión vector, modo embedding (provider/local), estado de carga.
- LLM fallback en UI: si `chat` lanza error (sin key / quota), mostrar mensaje con los documentos recuperados (como el server en modo local).
- Estado de carga durante embed/chat (spinner, disable botones).

### `frontend/src/App.tsx` (edición)

- Ruta `/chat` → `<ChatbotPage />` (grupo "Práctica", label "Chatbot Local").
- Import de la página.

## Flujo chat

1. Usuario escribe pregunta.
2. `embedTexts([pregunta])` → vector.
3. Cosine sobre docs de localStorage → top-4 con score ≥ 0.20.
4. Sin hits → respuesta explicando umbral (igual tono server).
5. Con hits → contexto `[fuente: id]\ntexto...` + system prompt (responder solo con contexto, español, citar fuentes, "No encontré suficiente información..." si no alcanza).
6. `chat(...)` → respuesta; fallback local si error.

## Consideraciones

- Sin dependencias nuevas (fetch puro, sin SDKs).
- Sin streaming en v1.
- CORS: todos los proveedores permiten browser (misma práctica del curso).
- Limpieza: `clearStore()` borra `chatbot-store`; historial se conserva (borrar historial = botón aparte).
- Umbral 0.20 y k=4 idénticos al server para consistencia pedagógica.

## Fuera de alcance (v1)

- PDF, DOCX.
- Streaming.
- Multi-usuario / permisos (owner único "local").
- Persistencia server del chat.