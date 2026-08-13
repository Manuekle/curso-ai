import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LessonShell } from "@/components/LessonShell"
import { CodeBlock } from "@/components/CodeBlock"
import { LiquidSlider } from "@/components/LiquidSlider"
import { NumberPopIn } from "@/components/NumberPopIn"

// Misma función que corre en server/rag.ts — duplicada acá para demo instantánea sin API
function chunkText(text: string, size: number, overlap: number): string[] {
  const chunks: string[] = []
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size))
  }
  return chunks
}

const SERVER_CODE = `// server/rag.ts — lo que corre en tu backend (#23)
export function chunkText(text: string, size = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size - overlap) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}`

export function ChunksLesson() {
  const [text, setText] = useState(
    "Política de vacaciones: cada empleado tiene 22 días hábiles por año completo. " +
      "Deben solicitarse con 15 días de anticipación. No pueden dividirse en más de 3 bloques. " +
      "Los días no usados se pierden, salvo razones médicas justificadas."
  )
  const [size, setSize] = useState(80)
  const [overlap, setOverlap] = useState(20)
  const chunks = chunkText(text, size, overlap)

  return (
    <LessonShell
      title="Chunking: partir documentos"
      tag="doc.md #23 · server/rag.ts"
      intro={
        <>
          <p>
            Un <strong>chunk</strong> es una fragmentación del documento. Antes de generar embeddings,
            el texto se parte en pedazos: cada chunk se embebe por separado y se guarda como un vector
            independiente. La estrategia de chunking influye directamente en la calidad del retrieval.
          </p>
          <p>
            <strong>Tamaño</strong>: chunks chicos = más foco semántico por pieza, pero pierden contexto
            (una respuesta puede necesitar varios chunks). Chunks grandes = más contexto, pero más ruido en
            la búsqueda y más tokens por documento.
          </p>
          <p>
            <strong>Overlap</strong>: solapa fragmentos para no cortar frases u oraciones a la mitad. Si un
            dato importante queda partido, ambas mitades sobreviven en algún chunk.
          </p>
        </>
      }
      code={{ label: "La función real de tu server", code: SERVER_CODE }}
      interview="¿Cómo elegirías el tamaño del chunk para 500.000 documentos corporativos?"
      solution="No hay número mágico: depende del contenido y de cómo se consulta. Chunks chicos = más foco semántico pero pierden contexto; grandes = más contexto pero más ruido y tokens. Estrategia: probar sobre una muestra real (400-800 chars típico, con overlap ~10-20% para no cortar frases), medir calidad del retrieval con preguntas representativas, y ajustar. Un solo tamaño para 500k docs no existe: segmentar por tipo de documento."
      prev={undefined}
      next={{ to: "/aprender/embeddings", label: "Embeddings" }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Probalo: mismo algoritmo, en tu navegador</CardTitle>
          <CardDescription>Sin llamada a la API — es la misma función que corre en el server</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="size">
                Tamaño (chars) — size = <NumberPopIn value={size} />
              </Label>
              <LiquidSlider
                id="size"
                min={20}
                max={200}
                value={size}
                onChange={setSize}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="overlap">
                Overlap (chars) — overlap = <NumberPopIn value={overlap} />
              </Label>
              <LiquidSlider
                id="overlap"
                min={0}
                max={40}
                value={overlap}
                onChange={setOverlap}
              />
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="min-h-24 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground">
            <NumberPopIn value={text.length} /> chars → <NumberPopIn value={chunks.length} /> chunks
          </p>
          <div className="flex flex-col gap-3">
            {chunks.map((c, i) => (
              <CodeBlock key={i} label={`chunk-${i}.txt (${c.length} chars)`} code={c} />
            ))}
          </div>
        </CardContent>
      </Card>
    </LessonShell>
  )
}

export default ChunksLesson