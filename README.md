# Curso AI — agentes + RAG

Plataforma interactiva para preparar entrevistas técnicas de IA, agentes y RAG: manual de estudio completo, playground y 21 lecciones con ejemplos prácticos.

## Stack

- **Backend** — Node.js, Express, TypeScript, OpenAI SDK (RAG, agentes, LLM). Maneja subida y procesamiento de PDF, Word, Excel y documentos.
- **Frontend** — React 19, Vite 8, TypeScript, Tailwind CSS 4, shadcn/ui, React Router 7, GSAP.
- **Base de datos** — PostgreSQL.

## Estructura

```text
curso-ai/
├── server/           # API Express (RAG, agentes, LLM)
├── frontend/         # Aplicación React (Vite) + manual (src/content/doc.md)
├── .env.example      # Variables de entorno de referencia
└── package.json      # Scripts del monorepo
```

## Requisitos

- Node.js 20+
- Copiar `.env.example` a `.env` y completar la clave de API (OpenAI / proveedor LLM)

## Scripts

| Comando            | Descripción                          |
| ------------------ | ------------------------------------ |
| `npm install`      | Instala dependencias del backend     |
| `npm run dev`      | Backend + frontend juntos (dev)      |
| `npm run dev:api`  | Solo API (puerto 4000)               |
| `npm run dev:web`  | Solo frontend (Vite)                 |
| `npm run seed`     | Carga datos de ejemplo               |
| `npm run typecheck`| Typecheck del monorepo               |

El frontend reenvía `/api/*` a `http://localhost:4000` durante el desarrollo.

## Despliegue (Vercel)

El frontend se despliega como aplicación Vite: en Vercel, define **Root Directory** como `frontend` (framework preseleccionado, comando de build `npm run build`, output `dist`). El backend (API Express) se despliega por separado (Vercel Functions, Render o similar).