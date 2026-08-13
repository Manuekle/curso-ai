# Frontend — Curso AI

Aplicación web interactiva para preparar entrevistas técnicas de IA, agentes y RAG.

Incluye:

- **Manual** — el material de estudio completo (`doc.md`) renderizado como documentación.
- **Playground** — prueba del backend (LLM, RAG, agentes).
- **21 lecciones** — LLM y tokens, contexto/temperatura, prompts y salida estructurada, RAG (chunking, embeddings, retrieval, pipeline, alucinaciones), agentes (workflows, tools, multiagentes), seguridad, APIs, arquitectura, producción, costos y modelos, evaluación, casos, ejercicios, TypeScript y simulacro de entrevista.
- Búsqueda instantánea (`⌘K`), tema claro/oscuro y diseño responsive.

## Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4 + shadcn/ui (Base UI)
- React Router 7
- GSAP (animaciones)
- Remix Icons

## Requisitos

- Node.js 20+
- Backend corriendo en `http://localhost:4000` (ver raíz del repo)

## Scripts

| Comando          | Descripción                      |
| ---------------- | -------------------------------- |
| `npm run dev`    | Servidor de desarrollo (Vite)    |
| `npm run build`  | Typecheck + build de producción  |
| `npm run preview`| Previsualizar el build           |
| `npm run lint`   | ESLint                           |
| `npm run format` | Prettier                         |
| `npm run typecheck` | Typecheck sin emitir          |

Para levantar frontend + API juntas, ejecuta `npm run dev` en la raíz del repositorio.

## Estructura

```text
frontend/
├── src/
│   ├── components/        # UI compartida (tabs, cards, badges, FlowDemo, LessonShell…)
│   ├── components/ui/     # Componentes shadcn/ui
│   ├── pages/             # DocsPage y Playground
│   ├── pages/lessons/     # Una página por lección
│   └── lib/utils.ts       # Helpers (cn, etc.)
├── index.html
├── vite.config.ts         # Alias @ → src, proxy /api → localhost:4000
└── package.json
```

## Backend

La API se llama bajo `/api/*` y Vite la reenvía a `http://localhost:4000` (ver `vite.config.ts`). El manual de estudio vive en `src/content/doc.md` y se importa como texto (`?raw`).

## Añadir componentes

```bash
npx shadcn@latest add button
```

Los componentes se colocan en `src/components/ui`.

Uso:

```tsx
import { Button } from "@/components/ui/button"
```
