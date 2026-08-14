import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { LessonShell } from "@/components/LessonShell"

const PYTHON_CODE = `# langchain: el pipeline RAG que viste en server/rag.ts, en 10 líneas
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

# 1. carga y chunking (≈ chunkText() del curso)
loader = TextLoader("politica_rh.txt")
chunks = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100).split_documents(loader.load())

# 2. embeddings + vector store (≈ store en memoria del curso)
db = FAISS.from_documents(chunks, OpenAIEmbeddings())

# 3. retriever: búsqueda top-K (≈ searchScored + umbral)
retriever = db.as_retriever(search_kwargs={"k": 4})

# 4. prompt con contexto + LLM (≈ ask() del curso)
prompt = ChatPromptTemplate.from_template(
    "Respondé SOLO con base en el contexto. Citá [fuente: ...]. "
    "Si el contexto no responde, decí que no encontraste información.\\n\\n"
    "Contexto:\\n{context}\\n\\nPregunta: {question}"
)

# 5. chain LCEL: los pipes componen el pipeline
chain = (
    {"context": retriever, "question": RunnablePassthrough()}
    | prompt
    | ChatOpenAI(temperature=0)
    | StrOutputParser()
)

print(chain.invoke("¿Cuándo se considera stock bajo?"))`

const JS_CODE = `// langchain.js (TypeScript): mismo pipeline, mismo API mental
import { ChatOpenAI } from "@langchain/openai";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const chain = RunnableSequence.from([
  { context: retriever, question: (q) => q },
  PromptTemplate.fromTemplate(
    "Respondé SOLO con base en el contexto. Citá [fuente: ...].\\n\\n" +
    "Contexto:\\n{context}\\n\\nPregunta: {question}"
  ),
  new ChatOpenAI({ temperature: 0 }),
  new StringOutputParser(),
]);

console.log(await chain.invoke("¿Cuándo se considera stock bajo?"));`

export function LangChainLesson() {
  return (
    <LessonShell
      title="LangChain: el framework de RAG y agentes"
      tag="doc.md #31 · langchain · langchain.js"
      intro={
        <>
          <p>
            <strong>LangChain</strong> es una capa de abstracción sobre LLMs, embeddings y bases
            vectoriales. Todo el pipeline que viste en <code className="font-mono text-[13px]">server/rag.ts</code> —
            chunking, embeddings, búsqueda, contexto, LLM — existe como pieza lista para componer:
            <em> document loaders, text splitters, vector stores, retrievers, prompts, chains y agentes</em>.
          </p>
          <p>
            El concepto central es la <strong>chain (LCEL)</strong>: un pipeline declarativo donde cada paso
            se conecta con <code className="font-mono text-[13px]">|</code>. Un RAG completo queda en ~10 líneas
            (ver Código). Debajo funciona exactamente igual que el ask() del curso: embed → top-K → contexto → LLM.
          </p>
          <p>
            <strong>Mapa con el curso:</strong>{" "}
            <code className="font-mono text-[13px]">chunkText()</code> ≈ <code className="font-mono text-[13px]">RecursiveCharacterTextSplitter</code>,
            el store en memoria ≈ <code className="font-mono text-[13px]">FAISS</code>/<code className="font-mono text-[13px]">pgvector</code>,
            <code className="font-mono text-[13px]"> searchScored()</code> ≈ <code className="font-mono text-[13px]">retriever</code>,
            y <code className="font-mono text-[13px]">ask()</code> ≈ la chain completa. Los agentes con tools del curso
            ≈ <code className="font-mono text-[13px]">AgentExecutor</code>. El chatbot local
            (<code className="font-mono text-[13px]">frontend/src/lib/localRag.ts</code>) es un "LangChain a mano"
            sin dependencias: muestra qué abstrae el framework.
          </p>
          <p>
            <strong>Cuándo NO usarlo:</strong> la abstracción oculta decisiones — qué embedding usás, dónde cae el
            fallback, cómo se filtran permisos. Para el curso (y para aprender el pipeline) se reimplementa a mano
            primero. En producción: pipelines complejos, multi-proveedor y agentes → LangChain paga; un solo
            endpoint RAG → llamada directa alcanza y debugea mejor. Existe también para TypeScript
            (<strong>langchain.js</strong>) y observabilidad con <strong>LangSmith</strong>.
          </p>
        </>
      }
      code={{ label: "LangChain (Python LCEL) y langchain.js", code: `${PYTHON_CODE}\n\n${JS_CODE}` }}
      interview="¿Qué aporta LangChain sobre llamar directo a la API del LLM? ¿Cuándo lo evitarías?"
      solution="Aporta composición declarativa (LCEL), piezas RAG/agentes/memoria listas, portabilidad entre proveedores y observabilidad (LangSmith). Lo evitaría cuando: el pipeline es simple (llamada directa basta y debugea mejor), necesitás control fino (permisos RBAC, umbrales, fallbacks custom — como el curso hace a mano), el costo de la abstracción supera su valor, o en cliente (bundle pesado). El framework no elimina las decisiones: las esconde."
      prev={{ to: "/aprender/alucinaciones", label: "Alucinaciones" }}
      next={{ to: "/aprender/agentes", label: "Agente con tools" }}
    >
      <div className="flex flex-col gap-3 rounded-lg border border-dashed bg-muted/40 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Probalo en la práctica: el Playground y el Chatbot Local reimplementan este pipeline a mano,
          con umbral, permisos y fallback visible paso a paso.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link to="/">
            <Button>Ir a la práctica →</Button>
          </Link>
          <Link to="/chat">
            <Button variant="outline">Chatbot Local →</Button>
          </Link>
        </div>
      </div>
    </LessonShell>
  )
}

export default LangChainLesson