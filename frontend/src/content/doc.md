# Manual de preparación — Entrevista Técnica

## Especialista en Inteligencia Artificial, Automatización, Agentes e Integraciones Empresariales

> **Objetivo:** prepararte para preguntas conceptuales, casos prácticos, ejercicios de arquitectura, problemas de seguridad, costos, APIs, agentes, RAG, LLMs y programación.

---

## Índice

- [0. Cómo usar este documento](#0-cómo-usar-este-documento)
- [PARTE I — Fundamentos de inteligencia artificial](#parte-i-fundamentos-de-inteligencia-artificial)
- [PARTE II — Workflows, automatización y agentes](#parte-ii-workflows-automatización-y-agentes)
- [PARTE III — Multiagentes](#parte-iii-multiagentes)
- [PARTE IV — RAG](#parte-iv-rag)
- [PARTE V — Seguridad](#parte-v-seguridad)
- [PARTE VI — APIs e integraciones](#parte-vi-apis-e-integraciones)
- [PARTE VII — Arquitectura empresarial](#parte-vii-arquitectura-empresarial)
- [PARTE VIII — Producción](#parte-viii-producción)
- [PARTE IX — Costos de IA](#parte-ix-costos-de-ia)
- [PARTE X — Elección de modelos](#parte-x-elección-de-modelos)
- [PARTE XI — Evaluación de agentes](#parte-xi-evaluación-de-agentes)
- [PARTE XII — Manejo de alucinaciones](#parte-xii-manejo-de-alucinaciones)
- [PARTE XIII — Google Workspace](#parte-xiii-google-workspace)
- [PARTE XIV — Tu proyecto Forge](#parte-xiv-tu-proyecto-forge)
- [PARTE XV — JavaScript / TypeScript](#parte-xv-javascript-typescript)
- [PARTE XVI — Casos de arquitectura](#parte-xvi-casos-de-arquitectura)
- [PARTE XVII — Preguntas típicas de entrevista](#parte-xvii-preguntas-típicas-de-entrevista)
- [PARTE XVIII — Preguntas de comportamiento técnico](#parte-xviii-preguntas-de-comportamiento-técnico)
- [PARTE XIX — Ejercicios de práctica](#parte-xix-ejercicios-de-práctica)
- [PARTE XX — Soluciones de los ejercicios](#parte-xx-soluciones-de-los-ejercicios)
- [PARTE XXI — Preguntas de nivel más alto](#parte-xxi-preguntas-de-nivel-más-alto)
- [PARTE XXII — Preguntas de “pizarra”](#parte-xxii-preguntas-de-pizarra)
- [PARTE XXIII — Respuestas cortas para memorizar](#parte-xxiii-respuestas-cortas-para-memorizar)
- [PARTE XXIV — Checklist de estudio](#parte-xxiv-checklist-de-estudio)
- [PARTE XXV — Regla para resolver cualquier caso](#parte-xxv-regla-para-resolver-cualquier-caso)
- [PARTE XXVI — Respuesta modelo para un caso complejo](#parte-xxvi-respuesta-modelo-para-un-caso-complejo)
- [PARTE XXVII — Tu “mapa mental” final](#parte-xxvii-tu-mapa-mental-final)
- [PARTE XXVIII — Las 15 ideas que debes recordar](#parte-xxviii-las-15-ideas-que-debes-recordar)
- [Frase final para la entrevista](#frase-final-para-la-entrevista)
- [Fin del material](#fin-del-material)

---

# 0. Cómo usar este documento

No estudies únicamente memorizando respuestas.

Para cada tema intenta hacer tres cosas:

1. **Entender el concepto.**
2. **Explicarlo con tus propias palabras.**
3. **Resolver un caso sin mirar la solución.**

La entrevista probablemente no será:

> “¿Qué es RAG?”

sino algo parecido a:

> “Tenemos 500.000 documentos corporativos y queremos crear un agente que los consulte. ¿Cómo lo diseñarías?”

Por eso este documento está organizado así:

```text
TEORÍA
   ↓
EJEMPLO
   ↓
PREGUNTA DE ENTREVISTA
   ↓
PRÁCTICA
   ↓
SOLUCIÓN AL FINAL
```

---

# PARTE I — FUNDAMENTOS DE INTELIGENCIA ARTIFICIAL

# 1. ¿Qué es un LLM?

Un **Large Language Model (LLM)** es un modelo entrenado con grandes cantidades de datos para procesar y generar lenguaje.

Puede realizar tareas como:

* Generar texto.
* Resumir.
* Clasificar.
* Extraer información.
* Traducir.
* Analizar código.
* Razonar sobre información.
* Utilizar herramientas mediante interfaces estructuradas.

Ejemplos de familias de modelos:

```text
OpenAI
Anthropic
Google Gemini
Modelos open source
```

---

## ¿Qué hace realmente un LLM?

Simplificando:

```text
Input
  ↓
Tokens
  ↓
Modelo
  ↓
Probabilidades
  ↓
Tokens de salida
  ↓
Respuesta
```

El modelo no funciona como una base de datos tradicional.

No debes asumir:

> “El modelo sabe exactamente qué información tiene.”

Es mejor pensar:

> “El modelo genera una respuesta basándose en los patrones aprendidos y el contexto que recibe.”

---

# 2. ¿Qué son los tokens?

Los modelos procesan texto mediante **tokens**.

Un token no necesariamente equivale a una palabra completa.

Por ejemplo:

```text
"inteligencia artificial"
```

puede dividirse en varias unidades.

El costo de muchos servicios de LLM depende de:

* Tokens de entrada.
* Tokens de salida.
* Modelo.
* Cantidad de llamadas.

---

## Ejemplo

```text
Usuario:
"Analiza este documento."

            ↓

Contexto:
Documento completo de 20 páginas.

            ↓

LLM
```

Si haces eso para miles de usuarios, el costo puede crecer rápidamente.

---

# 3. Context Window

El **context window** es la cantidad máxima de información que un modelo puede procesar dentro de una interacción.

Un error común es pensar:

> “Si el modelo soporta mucho contexto, debería enviarle todo.”

No necesariamente.

Más contexto puede significar:

* Mayor costo.
* Mayor latencia.
* Más ruido.
* Información irrelevante.
* Mayor complejidad.

La optimización consiste en proporcionar el **contexto necesario**, no el máximo posible.

---

# 4. Prompt Engineering

Es el diseño de instrucciones y contexto que recibe el modelo.

Un prompt normalmente puede contener:

```text
Rol
Objetivo
Contexto
Restricciones
Datos
Formato de salida
Ejemplos
```

---

## Ejemplo

### Prompt débil

```text
Analiza este documento.
```

### Prompt mejor estructurado

```text
Eres un analista financiero.

Objetivo:
Analizar el documento recibido.

Debes:
1. Identificar ingresos.
2. Identificar costos.
3. Detectar inconsistencias.
4. Generar un resumen.

No inventes información.

Si un dato no existe en el documento,
indica que no está disponible.

Devuelve JSON con:
{
  "ingresos": [],
  "costos": [],
  "riesgos": [],
  "resumen": ""
}
```

---

# IMPORTANTE: el prompt NO es seguridad

Nunca digas:

> “Voy a proteger la información mediante el prompt.”

El prompt puede establecer comportamiento.

Pero la seguridad debe estar en:

```text
Authentication
       ↓
Authorization
       ↓
Backend
       ↓
APIs
       ↓
Data access
```

Frase para recordar:

> **El prompt no es un mecanismo de seguridad.**

---

# 5. Temperature

La temperatura controla, de forma simplificada, cuánto puede variar la generación.

Un valor más bajo suele ser apropiado para tareas donde quieres mayor consistencia.

Ejemplo:

```text
Extracción de datos
      ↓
Temperatura baja
```

Mientras que tareas creativas pueden tolerar más variabilidad.

Importante:

> Temperature no convierte un modelo en “más inteligente”.

---

# 6. Structured Output

Cuando una aplicación necesita utilizar la respuesta de un LLM automáticamente, es mejor solicitar una estructura definida.

Ejemplo:

```json
{
  "customerId": "123",
  "risk": "high",
  "reason": "Three overdue invoices"
}
```

En lugar de:

```text
El cliente parece tener un riesgo alto porque...
```

La salida estructurada facilita:

* Validación.
* Persistencia.
* Integraciones.
* Automatización.
* Consistencia.

---

# PARTE II — WORKFLOWS, AUTOMATIZACIÓN Y AGENTES

# 7. ¿Qué es un workflow?

Un workflow es una secuencia de tareas definida.

Ejemplo:

```text
Formulario
   ↓
Validar
   ↓
Guardar
   ↓
Llamar API
   ↓
Enviar correo
```

Es normalmente:

* Determinista.
* Predecible.
* Fácil de auditar.

---

# 8. ¿Qué es un agente?

Un agente es un sistema que recibe un objetivo y puede:

* Interpretar una solicitud.
* Decidir qué acción realizar.
* Utilizar herramientas.
* Obtener información.
* Evaluar resultados.
* Continuar o finalizar.

Ejemplo:

```text
Usuario:
"Revisa mi inventario."

       ↓

Agente

       ↓

¿Necesito consultar ERP?

       ↓

consultarInventario()

       ↓

Analizar

       ↓

Responder
```

---

# 9. Workflow vs Agente

| Característica  | Workflow               | Agente              |
| --------------- | ---------------------- | ------------------- |
| Pasos           | Definidos              | Dinámicos           |
| Decisiones      | Reglas                 | Puede usar LLM      |
| Predictibilidad | Alta                   | Menor               |
| Costo           | Generalmente menor     | Puede ser mayor     |
| Auditoría       | Sencilla               | Más compleja        |
| Uso ideal       | Procesos deterministas | Problemas dinámicos |

---

# 10. ¿Cuándo NO utilizar IA?

Si un proceso puede resolverse perfectamente mediante:

```text
Código
+
Reglas
+
APIs
```

no existe necesariamente una razón para agregar IA.

Ejemplo:

```text
if stock < 10:
    sendAlert()
```

No necesitas un LLM para eso.

---

# 11. ¿Cuándo sí utilizar IA?

IA puede aportar valor cuando existe:

* Lenguaje natural.
* Documentos no estructurados.
* Clasificación.
* Resumen.
* Extracción.
* Razonamiento.
* Análisis de información.
* Toma de decisiones con contexto.

---

# 12. Regla importante

> **No todo problema necesita IA y no todo problema que necesita IA necesita un agente.**

---

# 13. Tool Calling / Function Calling

Un agente no debería ejecutar directamente cualquier operación.

Es mejor exponer herramientas específicas.

Ejemplo:

```text
consultarInventario()
crearProducto()
actualizarProducto()
eliminarProducto()
```

Arquitectura:

```text
Usuario
   ↓
Agente
   ↓
Tool
   ↓
API
   ↓
ERP
```

---

# 14. ¿Por qué usar Tools?

Porque permiten limitar qué acciones puede realizar el agente.

En lugar de:

```text
Agente
 ↓
Acceso completo a ERP
```

hacer:

```text
Agente
 ↓
Tools autorizadas
 ├── consultarInventario()
 ├── crearProducto()
 └── actualizarProducto()
```

---

# PARTE III — MULTIAGENTES

# 15. ¿Qué es un sistema multiagente?

Es una arquitectura donde diferentes agentes especializados colaboran para resolver un problema.

Ejemplo:

```text
                    ┌───────────────┐
                    │ Arquitectura  │
                    └───────┬───────┘
                            │
                            │
Usuario → Orquestador ──────┼─────── Seguridad
                            │
                            │
                    ┌───────┴───────┐
                    │    Backend    │
                    └───────────────┘
```

---

# 16. ¿Por qué utilizar varios agentes?

Porque un problema puede dividirse en responsabilidades.

Ejemplo:

```text
Proyecto
   ↓
 ┌──────────────┬─────────────┬───────────────┐
 ↓              ↓             ↓
Arquitectura   Seguridad     UX
 ↓              ↓             ↓
Resultado      Resultado     Resultado
 └──────────────┼─────────────┘
                ↓
           Orquestador
                ↓
           Resultado final
```

---

# 17. Problema de multiagentes

Más agentes no significa automáticamente mejor.

Puede aumentar:

* Costos.
* Latencia.
* Complejidad.
* Posibilidad de contradicciones.
* Dificultad de debugging.

Por eso debes poder responder:

> “¿Por qué realmente necesito cinco agentes?”

---

# 18. Orquestador

El orquestador es el componente que coordina el workflow.

Puede decidir:

* Qué agente ejecutar.
* Qué contexto darle.
* En qué orden.
* Qué resultados utilizar.
* Cuándo terminar.
* Cuándo pedir una segunda evaluación.

---

## Arquitectura

```text
                 ┌──────────────┐
                 │ Arquitectura │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │              │
Usuario ────────►│ Orquestador  │
                 │              │
                 └───┬────┬─────┘
                     │    │
              ┌──────┘    └──────┐
              ↓                  ↓
        ┌───────────┐       ┌──────────┐
        │ Seguridad │       │ Backend  │
        └─────┬─────┘       └────┬─────┘
              │                  │
              └────────┬─────────┘
                       ↓
                  Evaluación
                       ↓
                    Síntesis
```

---

# 19. ¿Cómo evitar loops infinitos?

Nunca confíes únicamente en el agente.

Usa límites externos:

```text
maxIterations
maxToolCalls
timeout
tokenBudget
costBudget
```

También:

* Detección de acciones repetidas.
* Condiciones de finalización.
* Circuit breakers.
* Cancelación.

---

# Ejemplo

```text
Agent
 ↓
Tool
 ↓
Resultado
 ↓
¿Finalizado?
 ├── Sí → End
 └── No
      ↓
¿maxIterations?
 ├── Sí → Stop
 └── No → Continue
```

---

# 20. ¿Cómo manejar contradicciones?

Puedes hacer que el orquestador:

1. Compare.
2. Detecte conflictos.
3. Busque evidencia.
4. Aplique reglas.
5. Evalúe resultados.
6. Genere síntesis.

Pero una contradicción crítica podría requerir:

```text
Agentes
   ↓
Conflicto
   ↓
Evaluación
   ↓
Humano
   ↓
Decisión
```

---

# PARTE IV — RAG

# 21. ¿Qué significa RAG?

**Retrieval-Augmented Generation**

Es una arquitectura donde el sistema recupera información relevante antes de generar la respuesta.

---

# 22. Flujo RAG

```text
                    DOCUMENTOS
                         ↓
                   Procesamiento
                         ↓
                      Chunks
                         ↓
                     Embeddings
                         ↓
                    Vector DB
```

Luego:

```text
Usuario
   ↓
Pregunta
   ↓
Embedding
   ↓
Búsqueda
   ↓
Filtro de permisos
   ↓
Documentos relevantes
   ↓
LLM
   ↓
Respuesta
```

---

# 23. ¿Qué es un chunk?

Un chunk es una fragmentación de un documento.

Ejemplo:

```text
Documento de 100 páginas
        ↓
 ┌──────┬──────┬──────┬──────┐
 │Chunk │Chunk │Chunk │Chunk │
 └──────┴──────┴──────┴──────┘
```

La estrategia de chunking influye en la calidad del retrieval.

---

# 24. ¿Qué son embeddings?

Un embedding representa información como vectores numéricos.

Conceptualmente:

```text
"Política de vacaciones"
          ↓
[0.12, -0.77, 0.42, ...]
```

Conceptos semánticamente relacionados tienden a estar próximos en el espacio vectorial, dependiendo del modelo y método utilizado.

---

# 25. Vector Database

Una base de datos vectorial permite almacenar y recuperar embeddings.

Ejemplo:

```text
Pregunta
   ↓
Embedding
   ↓
Vector Search
   ↓
Top K documentos
```

---

# 26. ¿Por qué RAG y no todo en el prompt?

Porque enviar todo:

* Consume más tokens.
* Puede aumentar costos.
* Aumenta latencia.
* Agrega ruido.
* No escala bien.

Mejor:

```text
Pregunta
 ↓
Buscar
 ↓
Recuperar
 ↓
Contexto relevante
 ↓
LLM
```

---

# 27. RAG NO garantiza cero alucinaciones

Una respuesta correcta:

> “RAG reduce el riesgo de alucinaciones al proporcionar información externa relevante, pero necesito validación, fuentes confiables y reglas para cuando no exista evidencia suficiente.”

Nunca digas:

> “RAG garantiza que la respuesta sea 100% real.”

---

# 28. RAG y seguridad

Este concepto es muy importante.

Tenemos:

```text
500.000 documentos
```

pero un usuario solo puede acceder a:

```text
2.500 documentos
```

El sistema debe aplicar permisos **antes de que el documento llegue al LLM**.

```text
Usuario
 ↓
Auth
 ↓
Roles
 ↓
Retriever
 ↓
Permission Filter
 ↓
Contexto permitido
 ↓
LLM
```

---

# PARTE V — SEGURIDAD

# 29. Authentication vs Authorization

## Authentication

Responde:

> “¿Quién eres?”

Ejemplo:

```text
Login
OAuth
Session
JWT
```

## Authorization

Responde:

> “¿Qué puedes hacer?”

Ejemplo:

```text
Admin → puede eliminar
Employee → solo puede consultar
```

---

# 30. OAuth

OAuth es un protocolo/framework para delegación de autorización.

Permite, por ejemplo, que una aplicación obtenga acceso autorizado a recursos de otro sistema.

Ejemplo:

```text
Aplicación
   ↓
OAuth
   ↓
Google
   ↓
Permiso
   ↓
Access Token
```

---

# 31. JWT

JWT es un formato de token.

Puede utilizarse para transportar información de identidad/autorización de forma firmada.

Importante:

> OAuth y JWT no son lo mismo.

Una aplicación puede utilizar OAuth y utilizar JWT en determinadas partes de su arquitectura.

---

# 32. RBAC

Role-Based Access Control.

Ejemplo:

```text
Admin
 ├── Read
 ├── Create
 ├── Update
 └── Delete

Employee
 └── Read
```

---

# 33. Principle of Least Privilege

Cada componente debe tener solamente los permisos que necesita.

No:

```text
Agent
 ↓
Admin Access
 ↓
Toda la empresa
```

Sí:

```text
Agent
 ↓
ConsultarInventario
 ↓
Solo lectura
```

---

# 34. Información sensible

Si el sistema procesa:

* Datos financieros.
* Datos personales.
* Contratos.
* Información de clientes.
* Información interna.

debes evaluar:

* Qué datos salen de la empresa.
* Qué proveedor recibe los datos.
* Retención.
* Cifrado.
* Acceso.
* Auditoría.
* Anonimización cuando sea apropiada.
* Cumplimiento aplicable.

---

# 35. ¿Cómo protegerías datos antes del LLM?

No solamente con prompting.

Puedes:

```text
Dato sensible
   ↓
Identificación
   ↓
Minimización
   ↓
Anonimización / Redacción
   ↓
LLM
```

Pero debes recordar:

> Anonimizar no reemplaza autorización.

---

# PARTE VI — APIs E INTEGRACIONES

# 36. REST

REST es un estilo de arquitectura común para APIs HTTP.

Ejemplo:

```text
GET    /products
POST   /products
GET    /products/123
PATCH  /products/123
DELETE /products/123
```

---

# 37. Métodos HTTP

```text
GET     → consultar
POST    → crear
PUT     → reemplazar
PATCH   → modificar parcialmente
DELETE  → eliminar
```

---

# 38. Status Codes

```text
200 → OK
201 → Created
204 → No Content

400 → Bad Request
401 → Unauthenticated
403 → Forbidden
404 → Not Found
409 → Conflict
429 → Too Many Requests

500 → Server Error
502 → Bad Gateway
503 → Service Unavailable
```

---

# 39. Webhooks

Un webhook permite que un sistema envíe una notificación HTTP cuando ocurre un evento.

Ejemplo:

```text
Pago realizado
      ↓
Sistema financiero
      ↓
POST /webhook
      ↓
Tu backend
      ↓
Procesar evento
```

---

# 40. Retry

No todos los errores deben reintentarse.

Ejemplo:

```text
429
503
timeout
```

pueden ser candidatos a retry dependiendo del caso.

Mientras que:

```text
400
401
403
```

normalmente requieren corregir la solicitud/autorización.

---

# 41. Idempotencia

Una operación idempotente puede repetirse sin producir efectos adicionales no deseados, dependiendo del diseño.

Esto es especialmente importante en:

* Pagos.
* Transferencias.
* Creación de registros.
* Webhooks.

Ejemplo:

```text
POST /payment

Idempotency-Key:
abc123
```

Si el cliente reintenta, el backend puede reconocer la misma operación.

---

# 42. Rate Limiting

Limita la cantidad de solicitudes permitidas.

Ejemplo:

```text
100 requests / minute
```

Protege contra:

* Abuso.
* Saturación.
* Costos inesperados.

---

# PARTE VII — ARQUITECTURA EMPRESARIAL

# 43. Arquitectura general

```text
                         Usuario
                            ↓
                     ┌────────────┐
                     │  Frontend  │
                     └─────┬──────┘
                           ↓
                     ┌────────────┐
                     │ API Gateway│
                     └─────┬──────┘
                           ↓
                     ┌────────────┐
                     │  Backend   │
                     └─────┬──────┘
                           ↓
                     ┌────────────┐
                     │Orquestador │
                     └─────┬──────┘
                           ↓
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
          Agent          RAG           Workflow
            ↓              ↓              ↓
          Tools          Vector DB       APIs
            ↓
      ┌─────┼──────┐
      ↓     ↓      ↓
     ERP   CRM   Google
```

---

# 44. Agente + ERP

```text
Usuario
   ↓
Chat
   ↓
Backend
   ↓
Agent
   ↓
Tool
   ↓
ERP API
   ↓
ERP
```

Nunca:

```text
Usuario
   ↓
LLM
   ↓
Base de datos
```

---

# 45. Agente + Google Workspace

```text
Usuario
   ↓
Agente
   ↓
Tools
 ├── Drive
 ├── Docs
 ├── Sheets
 └── Gmail
       ↓
 Google APIs
```

La integración puede utilizar mecanismos de autenticación y autorización adecuados para Google Workspace.

---

# 46. MCP

**Model Context Protocol (MCP)** es un protocolo que permite estandarizar cómo los modelos/agentes interactúan con herramientas y fuentes de contexto.

Conceptualmente:

```text
LLM / Agent
     ↓
    MCP
     ↓
 ┌───┼──────────┐
 ↓   ↓          ↓
ERP  Files    APIs
```

Importante:

> MCP no reemplaza autenticación, autorización ni reglas de negocio.

---

# PARTE VIII — PRODUCCIÓN

# 47. De prototipo a producción

Un prototipo demuestra:

> “La idea funciona.”

Producción necesita:

```text
Seguridad
Escalabilidad
Observabilidad
Disponibilidad
Costos
Resiliencia
Mantenibilidad
```

---

# 48. Observabilidad

Debes poder responder:

> “¿Qué hizo el sistema?”

Registrar, según corresponda:

```text
Request
 ↓
Agent
 ↓
Tool
 ↓
API
 ↓
Response
```

Puedes medir:

* Latencia.
* Errores.
* Tokens.
* Costo.
* Número de llamadas.
* Herramientas utilizadas.
* Tiempo de ejecución.
* Tasa de éxito.

---

# 49. Logs

Ejemplo conceptual:

```json
{
  "userId": "123",
  "workflowId": "inventory-01",
  "agent": "inventory-agent",
  "tool": "consultInventory",
  "durationMs": 842,
  "status": "success"
}
```

No debes registrar indiscriminadamente secretos o información sensible.

---

# 50. Tracing

Permite seguir una solicitud a través de múltiples componentes.

```text
Request
 ├── Agent
 │    ├── Tool A
 │    ├── Tool B
 │    └── LLM
 │
 └── Response
```

Especialmente útil en multiagentes.

---

# 51. Caching

Caching permite reutilizar resultados cuando sea apropiado.

Ejemplo:

```text
Pregunta frecuente
       ↓
    Cache
       ↓
Respuesta
```

Pero debes considerar:

* Expiración.
* Invalidez.
* Información cambiante.
* Datos sensibles.

---

# 52. Queue

Las colas permiten desacoplar procesos.

```text
User
 ↓
API
 ↓
Queue
 ↓
Worker
 ↓
Agent
 ↓
LLM
```

Es útil cuando el trabajo es:

* Pesado.
* Asíncrono.
* Lento.
* Susceptible a picos.

---

# 53. Rate limiting + Queue

Una combinación útil:

```text
Usuarios
   ↓
Rate Limiter
   ↓
API
   ↓
Queue
   ↓
Workers
   ↓
Agents
   ↓
LLM
```

---

# 54. Escalabilidad

Para decenas de miles de usuarios debes pensar en:

* Concurrencia.
* Límites del proveedor.
* Rate limiting.
* Caching.
* Queues.
* Workers.
* Database scaling.
* Observabilidad.

No basta con:

> “Pongo más servidores.”

---

# PARTE IX — COSTOS DE IA

# 55. ¿De dónde sale el costo?

Conceptualmente:

```text
Costo =
Tokens entrada
+
Tokens salida
+
Número de llamadas
+
Infraestructura
+
Herramientas externas
```

---

# 56. Optimización

Primero mide.

Después:

```text
1. Reducir contexto
2. Reducir llamadas
3. Seleccionar modelos
4. Cachear
5. Resumir memoria
6. Limitar iteraciones
7. Paralelizar
8. Eliminar IA innecesaria
9. Evaluar modelos alternativos
```

---

# 57. Model Routing

No todas las tareas necesitan el mismo modelo.

Ejemplo:

```text
Clasificación
    ↓
Modelo económico

Extracción
    ↓
Modelo eficiente

Razonamiento complejo
    ↓
Modelo más capaz
```

---

# 58. Open Source vs API

## API

Ventajas:

* Implementación rápida.
* Menor infraestructura.
* Escalabilidad gestionada.

Desventajas:

* Dependencia del proveedor.
* Costos por uso.
* Consideraciones de datos y compliance.

## Open Source

Ventajas:

* Mayor control.
* Posibilidad de ejecutar internamente.
* Personalización.

Desventajas:

* GPU.
* DevOps.
* Mantenimiento.
* Escalabilidad.
* Costos de infraestructura.

---

# PARTE X — ELECCIÓN DE MODELOS

# 59. ¿OpenAI, Anthropic, Gemini u Open Source?

No respondas:

> “X es el mejor.”

Responde:

> “Primero definiría los requisitos y después realizaría un benchmark.”

---

## Métricas

```text
Calidad
Costo
Latencia
Contexto
Privacidad
Integración
Escalabilidad
Infraestructura
```

---

# 60. Benchmark

Puedes crear un conjunto de casos reales:

```text
Test 1 → extracción
Test 2 → razonamiento
Test 3 → resumen
Test 4 → clasificación
Test 5 → tool calling
```

Después comparar:

```text
           Calidad    Costo    Latencia
Modelo A     90%      $0.02      900ms
Modelo B     93%      $0.04      1.1s
Modelo C     87%      $0.01      600ms
```

No elijas por popularidad.

---

# PARTE XI — EVALUACIÓN DE AGENTES

# 61. ¿Cómo sabes si un agente funciona?

No basta con:

> “Respondió.”

Debes evaluar:

### Correctness

¿La respuesta es correcta?

### Relevance

¿Responde lo que se preguntó?

### Groundedness

¿Está sustentada en las fuentes?

### Tool success

¿Utilizó correctamente las herramientas?

### Safety

¿Respetó permisos y restricciones?

### Cost

¿Cuánto cuesta?

### Latency

¿Cuánto demora?

---

# 62. Golden Dataset

Puedes crear casos con respuestas esperadas.

```text
Input
   ↓
Agent
   ↓
Output
   ↓
Expected Output
   ↓
Evaluator
```

Esto permite probar cambios de:

* Prompt.
* Modelo.
* RAG.
* Tools.
* Orquestación.

---

# 63. Regression Testing

Cambias un prompt.

Antes:

```text
95% correcto
```

Después:

```text
87% correcto
```

Debes detectar la regresión antes de producción.

---

# PARTE XII — MANEJO DE ALUCINACIONES

# 64. ¿Por qué ocurren?

Pueden ocurrir por:

* Falta de contexto.
* Contexto incorrecto.
* Información ambigua.
* Modelo.
* Prompt.
* Recuperación deficiente.
* Instrucciones contradictorias.

---

# 65. Mitigación

No existe una única solución.

Usa una combinación:

```text
RAG
+
Fuentes confiables
+
Structured Output
+
Validación
+
Tool usage
+
Guardrails
+
Evaluation
```

---

# 66. Regla crítica

Si no existe evidencia:

```text
"No encontré suficiente información
para responder con seguridad."
```

Es mejor eso que inventar.

---

# PARTE XIII — GOOGLE WORKSPACE

# 67. Arquitectura

```text
Usuario
 ↓
Agente
 ↓
OAuth
 ↓
Google APIs
 ├── Drive
 ├── Docs
 ├── Sheets
 ├── Gmail
 └── Calendar
```

---

# 68. Gemini + Google Workspace

No confundas:

```text
Modelo
```

con:

```text
Herramienta
```

Puedes diseñar una arquitectura donde:

```text
OpenAI
   \
Anthropic ----→ Agent → Google APIs
   /
Gemini
```

No necesitas utilizar Gemini únicamente porque uses Google Workspace.

La decisión depende de los requisitos de la solución.

---

# PARTE XIV — TU PROYECTO FORGE

# 69. Cómo presentar Forge

Usa esta estructura:

```text
Problema
   ↓
Decisión de arquitectura
   ↓
Implementación
   ↓
Tecnologías
   ↓
Resultado
   ↓
Qué mejorarías
```

---

## Problema

Los agentes independientes podían:

* Repetir contexto.
* Duplicar trabajo.
* Generar contradicciones.
* Crear loops.
* Incrementar costos.

---

## Arquitectura

```text
                        Contexto
                           ↓
                    ┌─────────────┐
                    │ Orquestador │
                    └──────┬──────┘
                           ↓
            ┌──────────────┼──────────────┐
            ↓              ↓              ↓
       Arquitectura     Diseño        Seguridad
            │              │              │
            └──────────────┼──────────────┘
                           ↓
                       Evaluación
                           ↓
                        Síntesis
                           ↓
                     Resultado final
```

---

## Stack

Utiliza solamente aquello que realmente hayas utilizado.

Una descripción consistente con lo que has contado:

```text
Frontend / aplicación
        ↓
Node.js / backend
        ↓
PostgreSQL
        ↓
Azure / modelos LLM
```

Si utilizaste React o Next.js, menciónalos como frontend.

Node.js es normalmente utilizado en backend/runtime, no como frontend.

---

# 70. Preguntas sobre Forge

## ¿Por qué multiagente?

> Porque el problema podía dividirse en responsabilidades especializadas.

## ¿Por qué un orquestador?

> Para centralizar el contexto, coordinar los agentes y sintetizar los resultados.

## ¿Cómo evitar loops?

> Con límites de iteración, timeouts, límites de llamadas y condiciones explícitas de finalización.

## ¿Cómo reducir costos?

> Reducción de contexto, selección de modelos, caching, memoria resumida y eliminación de llamadas innecesarias.

## ¿Qué mejorarías?

> Implementaría más evaluación automática, observabilidad y benchmarks para medir calidad, costo y latencia.

---

# PARTE XV — JAVASCRIPT / TYPESCRIPT

# 71. Consumir una API

```typescript
async function getInventory() {
  const response = await fetch("/api/inventory");

  if (!response.ok) {
    throw new Error("Failed to fetch inventory");
  }

  return response.json();
}
```

---

# 72. Manejo de errores

```typescript
try {
  const inventory = await getInventory();

  console.log(inventory);
} catch (error) {
  console.error(error);
}
```

---

# 73. Transformación de datos

```typescript
const products = [
  { name: "Laptop", stock: 5 },
  { name: "Mouse", stock: 30 }
];

const lowStock = products.filter(
  product => product.stock < 10
);
```

Resultado:

```json
[
  {
    "name": "Laptop",
    "stock": 5
  }
]
```

---

# 74. Async/Await

Concepto:

```text
Request
 ↓
await
 ↓
Response
 ↓
Process
```

Debes entender:

* Promise.
* async.
* await.
* try/catch.
* Error handling.

---

# 75. Promise.all

Cuando las operaciones son independientes:

```typescript
const [inventory, sales] = await Promise.all([
  getInventory(),
  getSales()
]);
```

Puede reducir latencia respecto a ejecutarlas secuencialmente.

Pero debes tener cuidado con:

* Límites de APIs.
* Errores parciales.
* Carga.
* Dependencias.

---

# PARTE XVI — CASOS DE ARQUITECTURA

# CASO 1 — INVENTARIO

La empresa quiere:

> “Mostrar productos cuyo inventario sea menor a 10.”

### Antes de resolver

Pregunta mentalmente:

```text
¿Es determinista?
¿Necesito IA?
¿Qué API existe?
¿Qué permisos necesito?
```

---

# CASO 2 — ACTUALIZAR INVENTARIO

Usuario:

> “Cambia el inventario del producto 123 a 100.”

Problema:

Es una acción de escritura.

Arquitectura esperada:

```text
Usuario
 ↓
Agente
 ↓
Identificar producto
 ↓
Validar permisos
 ↓
Mostrar operación
 ↓
Confirmación
 ↓
API ERP
 ↓
Auditoría
```

---

# CASO 3 — ELIMINAR PRODUCTO

Usuario:

> “Elimina el producto 123.”

La operación es potencialmente destructiva.

Solución:

```text
Request
 ↓
Validación
 ↓
Permisos
 ↓
Confirmación
 ↓
Delete API
 ↓
Audit Log
```

---

# CASO 4 — DOCUMENTOS

Empresa:

> “Tenemos 500.000 documentos y los empleados preguntan sobre políticas internas.”

Solución:

```text
Documents
 ↓
Processing
 ↓
Chunks
 ↓
Embeddings
 ↓
Vector DB

User Query
 ↓
Authorization
 ↓
Retrieval
 ↓
Relevant chunks
 ↓
LLM
 ↓
Answer + Sources
```

---

# CASO 5 — ERP + FINANZAS + GOOGLE WORKSPACE

Solicitud:

> “Revisa las ventas del mes, compáralas con inventario y crea un informe.”

Arquitectura:

```text
                          Usuario
                             ↓
                         Frontend
                             ↓
                          Backend
                             ↓
                       Orquestador
                             ↓
             ┌───────────────┼───────────────┐
             ↓               ↓               ↓
            ERP          Finanzas        Documents
             ↓               ↓               ↓
            API             API            RAG
             └───────────────┼───────────────┘
                             ↓
                         Validación
                             ↓
                           LLM
                             ↓
                       Crear informe
                             ↓
                     Google Workspace
                             ↓
                       Revisión humana
```

---

# CASO 6 — SISTEMA LEGACY

No asumas que “legacy” significa que debes poner un agente.

Primero investigar:

```text
¿Tiene API?
¿Tiene DB?
¿Tiene archivos?
¿Tiene web services?
¿Existe middleware?
```

Puedes construir un adaptador:

```text
Legacy
  ↓
Adapter
  ↓
JSON normalizado
  ↓
Backend
  ↓
Agent / Workflow
```

---

# PARTE XVII — PREGUNTAS TÍPICAS DE ENTREVISTA

# Preguntas conceptuales

## 1. ¿Qué es un LLM?

Respuesta:

> Un modelo capaz de procesar y generar lenguaje utilizando patrones aprendidos durante entrenamiento.

---

## 2. ¿Qué es RAG?

> Arquitectura que recupera información relevante para proporcionar contexto al LLM antes de generar la respuesta.

---

## 3. ¿Qué es un embedding?

> Una representación vectorial de información que permite comparar relaciones semánticas.

---

## 4. ¿Qué es un agente?

> Un sistema que recibe un objetivo y puede decidir qué herramientas o acciones utilizar para conseguirlo.

---

## 5. ¿Qué es un orquestador?

> El componente encargado de coordinar agentes, contexto, herramientas y resultados.

---

## 6. ¿Qué es MCP?

> Un protocolo para estandarizar la interacción entre modelos/agentes y herramientas o fuentes de contexto.

---

# Preguntas de arquitectura

## 7. ¿Cómo diseñarías un agente conectado a un ERP?

Piensa:

```text
User
 ↓
Backend
 ↓
Agent
 ↓
Tools
 ↓
ERP API
```

---

## 8. ¿Cómo escalarías a 50.000 usuarios?

Piensa:

```text
Load Balancer
 ↓
Backend
 ↓
Cache
 ↓
Queue
 ↓
Workers
 ↓
Agents
 ↓
LLM
```

---

## 9. ¿Cómo reducirías costos?

Piensa:

```text
Measure
 ↓
Context reduction
 ↓
Model routing
 ↓
Caching
 ↓
Fewer calls
 ↓
Limits
```

---

# Preguntas de seguridad

## 10. ¿Cómo proteges datos sensibles?

Respuesta:

> Autenticación, autorización, mínimo privilegio, filtrado de datos, cifrado, auditoría y evaluación de qué información se envía a proveedores externos.

---

## 11. ¿El prompt puede impedir que vea información?

Respuesta:

> No debería depender de eso. El acceso debe controlarse en backend, APIs y capa de recuperación.

---

## 12. ¿Cómo protegerías una transferencia bancaria?

Respuesta:

```text
Agent
 ↓
Prepare
 ↓
Validate
 ↓
Human confirmation
 ↓
Authorization
 ↓
API
 ↓
Audit
```

---

# Preguntas de producción

## 13. ¿Qué haces si el agente falla?

Piensa en:

* Logs.
* Retries.
* Timeout.
* Fallback.
* Circuit breaker.
* Error response.
* Observabilidad.

---

## 14. ¿Cómo sabes que está funcionando?

Métricas:

```text
Accuracy
Latency
Cost
Error rate
Success rate
User satisfaction
Automation rate
```

---

# PARTE XVIII — PREGUNTAS DE COMPORTAMIENTO TÉCNICO

# 1. ¿Qué haces cuando no conoces una tecnología?

Respuesta:

> “Primero entendería el problema y las restricciones. Después investigaría la documentación oficial y haría un pequeño proof of concept antes de integrarla en producción.”

---

# 2. ¿Qué haces cuando negocio quiere algo en dos semanas y técnicamente tarda dos meses?

Respuesta:

> “Separaría requisitos imprescindibles de los deseables y propondría un MVP que entregue valor en esas dos semanas, dejando claras las limitaciones y el plan para la segunda fase.”

---

# 3. ¿Qué priorizas: velocidad o calidad?

Respuesta:

> “Depende del riesgo. Para una prueba interna puedo priorizar velocidad, pero para procesos financieros o críticos priorizaría seguridad, confiabilidad y trazabilidad.”

---

# PARTE XIX — EJERCICIOS DE PRÁCTICA

# NO MIRAR SOLUCIONES

> Intenta resolver estos ejercicios primero sobre papel.

---

# Ejercicio 1 — Clasificación

Una empresa recibe 20.000 correos diarios.

Necesita clasificarlos en:

```text
Ventas
Soporte
Finanzas
RRHH
Spam
```

### Preguntas

1. ¿Usarías workflow o IA?
2. ¿Usarías un agente?
3. ¿Qué modelo utilizarías?
4. ¿Cómo medirías precisión?
5. ¿Cómo controlarías costos?

---

# Ejercicio 2 — Documentos

Una empresa tiene:

```text
100.000 PDFs
20.000 Word
10.000 Excel
```

Los empleados necesitan preguntar:

> “¿Qué dice el contrato del cliente X sobre renovación?”

### Preguntas

1. ¿Usarías RAG?
2. ¿Cómo procesarías los documentos?
3. ¿Qué guardarías?
4. ¿Cómo controlarías permisos?
5. ¿Cómo evitarías enviar todos los documentos al LLM?

---

# Ejercicio 3 — ERP

El usuario dice:

> “Elimina todos los productos sin ventas durante un año.”

### Preguntas

1. ¿Lo permitirías directamente?
2. ¿Qué herramientas necesitaría el agente?
3. ¿Qué validaciones pondrías?
4. ¿Solicitarías aprobación?
5. ¿Cómo auditarías?

---

# Ejercicio 4 — Finanzas

El usuario dice:

> “Transfiere $20.000.000 a este proveedor.”

### Preguntas

1. ¿El agente puede ejecutar directamente?
2. ¿Qué permisos necesita?
3. ¿Qué información debe validar?
4. ¿Dónde implementarías los controles?
5. ¿Qué registrarías?

---

# Ejercicio 5 — Multiagente

Tienes:

```text
Agent A → Arquitectura
Agent B → Backend
Agent C → Seguridad
Agent D → QA
```

Pero el sistema entra en un loop.

### Preguntas

1. ¿Por qué puede ocurrir?
2. ¿Cómo lo detectarías?
3. ¿Cómo lo detendrías?
4. ¿Qué papel tiene el orquestador?
5. ¿Cómo reducirías costos?

---

# Ejercicio 6 — RAG y permisos

Un empleado de Finanzas consulta:

> “¿Cuál es el salario de los empleados?”

El sistema recupera documentos de RRHH.

### Pregunta

¿Dónde resolverías esto?

```text
Prompt
Modelo
Retriever
Backend
Base de datos
```

Explica por qué.

---

# Ejercicio 7 — Producción

Tienes un agente funcionando.

En producción:

```text
Latencia ↑
Costo ↑
Errores ↑
Usuarios ↑
```

### Diseña una estrategia de solución.

---

# Ejercicio 8 — OpenAI vs Anthropic vs Gemini

La empresa te pide:

> “Escoge un proveedor de LLM.”

### Preguntas

¿Qué evaluarías?

No puedes responder únicamente:

> “Yo elegiría X.”

Debes construir criterios.

---

# Ejercicio 9 — Legacy

Un sistema legacy:

```text
No tiene API moderna.
```

Pero sí puede exportar:

```text
CSV
```

Cada hora.

### Pregunta

¿Cómo integrarías este sistema en una arquitectura de IA?

---

# Ejercicio 10 — Google Workspace

La empresa quiere:

> “Recibir una solicitud en un chat → consultar información → crear un documento en Google Docs → enviarlo para revisión.”

### Diseña el flujo completo.

---

# Ejercicio 11 — Código

Observa:

```typescript
async function executeAgent(userInput: string) {
  const documents = await getAllDocuments();

  const response = await llm.generate({
    prompt: `
      User:
      ${userInput}

      Documents:
      ${JSON.stringify(documents)}
    `
  });

  return response;
}
```

### Preguntas

Encuentra al menos 6 problemas.

---

# Ejercicio 12 — Costos

Tienes:

```text
5 agentes
5 llamadas cada uno
25 llamadas por workflow
```

10.000 workflows diarios.

### Preguntas

¿Qué intentarías optimizar?

---

# Ejercicio 13 — Arquitectura

Dibuja en papel:

```text
Usuario
ERP
Google Workspace
RAG
LLM
Base de datos
Agentes
Seguridad
Logs
```

Construye una arquitectura completa.

---

# PARTE XX — SOLUCIONES DE LOS EJERCICIOS

# Solución 1 — Clasificación de correos

### Respuesta

Podría resolverse con un workflow + modelo de clasificación.

No necesariamente necesito un agente.

```text
Email
 ↓
Preprocessing
 ↓
Classifier
 ↓
Categoría
 ↓
Workflow
 ↓
Acción
```

¿Por qué?

La clasificación tiene un objetivo relativamente acotado.

No necesitamos autonomía compleja.

### Evaluación

Usaría:

* Accuracy.
* Precision.
* Recall.
* F1.
* Tasa de errores.

---

# Solución 2 — Documentos

Sí usaría RAG.

```text
Documents
 ↓
Extraction
 ↓
Normalization
 ↓
Chunking
 ↓
Embeddings
 ↓
Vector DB
```

Consulta:

```text
User
 ↓
Authentication
 ↓
Authorization
 ↓
Retriever
 ↓
Relevant docs
 ↓
LLM
 ↓
Answer
```

Para Excel no asumiría simplemente que siempre debe convertirse a Markdown.

Podría requerirse:

* extracción de tablas;
* procesamiento de filas/columnas;
* fórmulas;
* estructura;
* metadata.

---

# Solución 3 — Eliminar productos

No ejecutaría directamente una eliminación masiva.

Primero:

```text
Agent
 ↓
Consultar productos
 ↓
Calcular candidatos
 ↓
Validar reglas
 ↓
Mostrar lista
 ↓
Confirmación humana
 ↓
Eliminar
 ↓
Audit log
```

---

# Solución 4 — Transferencia financiera

No permitiría una transferencia directa solo porque el agente la haya decidido.

Arquitectura:

```text
Usuario
 ↓
Agent
 ↓
Preparar transferencia
 ↓
Validar datos
 ↓
Validar permisos
 ↓
Mostrar operación
 ↓
Human approval
 ↓
Backend authorization
 ↓
Financial API
 ↓
Audit log
```

---

# Solución 5 — Multiagente

Los loops pueden ocurrir por:

* Agentes sin límites.
* Dependencias circulares.
* Contexto ambiguo.
* Falta de condición de finalización.
* Agentes llamándose entre ellos.

Solución:

```text
Orchestrator
 ↓
Agent
 ↓
Result
 ↓
Evaluator
 ↓
¿Finalizado?
```

Y límites:

```text
maxIterations
maxToolCalls
timeout
budget
```

---

# Solución 6 — RAG y permisos

La respuesta correcta es:

> **Retriever + autorización/backend.**

No:

> Prompt.

Arquitectura:

```text
Usuario
 ↓
Authentication
 ↓
Authorization
 ↓
Retriever
 ↓
Permission Filter
 ↓
Allowed documents
 ↓
LLM
```

---

# Solución 7 — Producción

Problema:

```text
Latency ↑
Cost ↑
Errors ↑
Traffic ↑
```

Orden de análisis:

```text
1. Logs
2. Metrics
3. Tracing
4. Bottleneck
5. LLM calls
6. API limits
7. Database
8. Queue
9. Cache
10. Concurrency
```

Después optimizar:

```text
Caching
Model routing
Context reduction
Queue
Workers
Rate limiting
Retries
Timeouts
```

---

# Solución 8 — Selección del proveedor

No elegir por preferencia.

Construir benchmark.

```text
                    Modelo A
                       │
                       ├── Calidad
                       ├── Costo
                       ├── Latencia
                       ├── Contexto
                       └── Seguridad

                    Modelo B
                       │
                       └── mismas pruebas

                    Modelo C
                       │
                       └── mismas pruebas
```

Luego comparar.

---

# Solución 9 — Legacy CSV

Si el sistema exporta CSV cada hora:

```text
Legacy
 ↓
CSV
 ↓
File Processor
 ↓
Validation
 ↓
Normalization
 ↓
Database
 ↓
Agent / Workflow
```

No necesariamente necesito un agente para leer el CSV.

Puedo utilizar código tradicional para:

* Parsear.
* Validar.
* Transformar.
* Guardar.

Después el agente puede utilizar esa información.

---

# Solución 10 — Google Workspace

```text
Usuario
 ↓
Chat
 ↓
Backend
 ↓
Authentication
 ↓
Agent
 ↓
Tools
 ├── ERP
 ├── RAG
 └── Google APIs
          ↓
       Google Docs
          ↓
      Human Review
```

---

# Solución 11 — Código

Código:

```typescript
const documents = await getAllDocuments();
```

Problemas:

### 1. Trae todos los documentos

No hay retrieval.

### 2. No hay autorización

Puede traer documentos que el usuario no puede consultar.

### 3. Contexto enorme

Puede aumentar costos.

### 4. No hay límites

Puede generar problemas de consumo.

### 5. No hay validación

No sabemos qué documentos son relevantes.

### 6. Posibles datos sensibles

Se está enviando todo al LLM.

### 7. No hay observabilidad

No hay logs o tracing.

### 8. No hay manejo de errores

Si `getAllDocuments()` falla, no existe recuperación.

### Mejor arquitectura

```text
User
 ↓
Auth
 ↓
Authorization
 ↓
Retriever
 ↓
Relevant authorized docs
 ↓
LLM
 ↓
Structured Output
 ↓
Validation
```

---

# Solución 12 — Costos

Tienes:

```text
25 llamadas / workflow
```

Antes de optimizar preguntaría:

```text
¿Por qué 25?
```

Posibles optimizaciones:

```text
Eliminar agentes redundantes
        ↓
Reducir llamadas
        ↓
Paralelizar llamadas independientes
        ↓
Model routing
        ↓
Caching
        ↓
Context reduction
        ↓
Limitar loops
```

---

# Solución 13 — Arquitectura completa

Una posible solución:

```text
                               USUARIO
                                  │
                                  ↓
                           ┌────────────┐
                           │  FRONTEND  │
                           └─────┬──────┘
                                 ↓
                           ┌────────────┐
                           │ API GATEWAY│
                           └─────┬──────┘
                                 ↓
                       ┌──────────────────┐
                       │ Authentication   │
                       │ Authorization     │
                       └────────┬─────────┘
                                ↓
                       ┌──────────────────┐
                       │   ORCHESTRATOR   │
                       └────────┬─────────┘
                                ↓
                 ┌──────────────┼──────────────┐
                 ↓              ↓              ↓
               AGENT           RAG          WORKFLOW
                 │              │              │
                 ↓              ↓              ↓
               Tools         Vector DB       APIs
                 │
        ┌────────┼────────┐
        ↓        ↓        ↓
       ERP    Google    Legacy
                │
                ↓
             LLMs
                │
                ↓
        ┌───────────────┐
        │ Validation    │
        └───────┬───────┘
                ↓
             Result
                │
                ↓
       ┌─────────────────┐
       │ Audit + Logs    │
       │ Metrics + Trace │
       └─────────────────┘
```

---

# PARTE XXI — PREGUNTAS DE NIVEL MÁS ALTO

## 1. ¿Por qué un agente y no un workflow?

Respuesta:

> “Porque necesito que el sistema tome decisiones dinámicas sobre qué herramientas utilizar. Si el proceso es completamente determinista, prefiero un workflow.”

---

## 2. ¿Por qué multiagente?

Respuesta:

> “Porque el problema tiene diferentes responsabilidades que pueden especializarse y evaluarse por separado.”

---

## 3. ¿Cuándo usarías human-in-the-loop?

Especialmente en:

* Transferencias.
* Eliminaciones.
* Decisiones financieras.
* Contratos.
* Acciones irreversibles.
* Información altamente sensible.

---

## 4. ¿Qué pasa si una API externa está caída?

Debo considerar:

```text
Timeout
 ↓
Retry
 ↓
Backoff
 ↓
Circuit breaker
 ↓
Fallback
 ↓
Error controlado
```

---

## 5. ¿Qué pasa si el LLM está caído?

Dependiendo del sistema:

```text
Primary model
      ↓
Failure
      ↓
Fallback model
      ↓
Reduced functionality
      ↓
Graceful failure
```

No siempre tiene sentido un fallback automático, pero debe evaluarse según criticidad.

---

## 6. ¿Cómo desacoplarías el proveedor?

Utilizaría una abstracción:

```text
Application
     ↓
LLM Interface
     ↓
 ┌───┼───────────────┐
 ↓   ↓               ↓
OpenAI Anthropic   Gemini
```

Así el resto de la aplicación depende de una interfaz común, no del proveedor directamente.

---

# PARTE XXII — PREGUNTAS DE “PIZARRA”

Practica dibujando estas cinco sin mirar.

## Diagrama 1

> Diseña un agente conectado a un ERP.

---

## Diagrama 2

> Diseña un RAG corporativo.

---

## Diagrama 3

> Diseña un sistema multiagente.

---

## Diagrama 4

> Diseña una arquitectura para 50.000 usuarios.

---

## Diagrama 5

> Diseña un agente financiero seguro.

---

# PARTE XXIII — RESPUESTAS CORTAS PARA MEMORIZAR

### ¿Qué es un agente?

> Sistema orientado a objetivos que puede decidir y utilizar herramientas para alcanzar una tarea.

### ¿Qué es RAG?

> Recuperación de información relevante para proporcionar contexto a un LLM antes de generar una respuesta.

### ¿Qué es un embedding?

> Una representación vectorial utilizada para comparar información semánticamente.

### ¿Qué es un workflow?

> Una secuencia de pasos definidos para automatizar un proceso.

### ¿Qué es un orquestador?

> El componente que coordina agentes, herramientas, contexto y resultados.

### ¿Cómo reduces costos?

> Menos contexto, menos llamadas, modelos adecuados, caching, memoria selectiva y límites de ejecución.

### ¿Cómo proteges datos?

> Authentication, authorization, least privilege, minimización de datos, validación y auditoría.

### ¿Cómo evitas loops?

> Máximo de iteraciones, límites de llamadas, timeout, presupuesto y condiciones de finalización.

### ¿Cómo eliges un LLM?

> Benchmark basado en calidad, costo, latencia, seguridad, contexto e integración.

### ¿RAG elimina alucinaciones?

> No. Las reduce, pero necesito fuentes confiables y validación.

### ¿El prompt es seguridad?

> No. Los permisos deben imponerse en la arquitectura.

### ¿Siempre usarías IA?

> No. Si un workflow tradicional resuelve mejor el problema, mantendría el workflow.

---

# PARTE XXIV — CHECKLIST DE ESTUDIO

## Inteligencia Artificial

* [ ] LLM
* [ ] Tokens
* [ ] Context window
* [ ] Prompt engineering
* [ ] Structured output
* [ ] Temperature
* [ ] Function calling
* [ ] Tool calling

## RAG

* [ ] Chunking
* [ ] Embeddings
* [ ] Vector database
* [ ] Retrieval
* [ ] Reranking
* [ ] Metadata
* [ ] Permissions
* [ ] Evaluation

## Agentes

* [ ] Agent
* [ ] Tool
* [ ] Orchestrator
* [ ] Multi-agent
* [ ] Memory
* [ ] Planning
* [ ] Guardrails
* [ ] Loops
* [ ] Human-in-the-loop

## Automatización

* [ ] Workflow
* [ ] Pipeline
* [ ] Queue
* [ ] Worker
* [ ] Webhook
* [ ] Cron
* [ ] Retry
* [ ] Timeout
* [ ] Circuit breaker

## APIs

* [ ] REST
* [ ] HTTP
* [ ] JSON
* [ ] OAuth
* [ ] JWT
* [ ] API Key
* [ ] Webhook
* [ ] Rate limiting
* [ ] Idempotency

## Seguridad

* [ ] Authentication
* [ ] Authorization
* [ ] RBAC
* [ ] Least privilege
* [ ] Encryption
* [ ] Secrets
* [ ] Audit logs
* [ ] Data minimization

## Producción

* [ ] Logging
* [ ] Monitoring
* [ ] Tracing
* [ ] Caching
* [ ] Queue
* [ ] Workers
* [ ] Load balancing
* [ ] Load testing
* [ ] Cost monitoring

## LLM Providers

* [ ] OpenAI
* [ ] Anthropic
* [ ] Gemini
* [ ] Azure
* [ ] Open source
* [ ] Benchmarking
* [ ] Model routing

## Desarrollo

* [ ] JavaScript
* [ ] TypeScript
* [ ] Node.js
* [ ] REST API
* [ ] Async/Await
* [ ] Error handling
* [ ] PostgreSQL

---

# PARTE XXV — REGLA PARA RESOLVER CUALQUIER CASO

Cuando el entrevistador te entregue un problema, piensa:

```text
                PROBLEMA
                   ↓
          ¿Qué necesita negocio?
                   ↓
         ¿Qué partes son deterministas?
              ↙            ↘
             ↓              ↓
         Workflow           IA
                             ↓
                       ¿Agente?
                             ↓
                       ¿Multiagente?
                             ↓
                       ¿Qué tools?
                             ↓
                         ¿Qué datos?
                             ↓
                           RAG
                             ↓
                     ¿Qué permisos?
                             ↓
                     ¿Cómo validamos?
                             ↓
                       ¿Cómo escalar?
                             ↓
                       ¿Cuánto cuesta?
                             ↓
                     ¿Cómo monitorear?
                             ↓
                         PRODUCCIÓN
```

---

# PARTE XXVI — RESPUESTA MODELO PARA UN CASO COMPLEJO

Si te dicen:

> “Diseña una solución de IA para automatizar un proceso empresarial.”

Puedes empezar:

> “Primero entendería el proceso actual y definiría el resultado que necesita el negocio. Después separaría las tareas deterministas de las que realmente necesitan IA. Para las tareas deterministas utilizaría código, workflows y APIs; para información no estructurada o tareas que requieran razonamiento evaluaría un LLM o un agente.
>
> Después definiría las herramientas que necesita el agente, las integraciones con los sistemas existentes y los permisos que debe tener cada operación.
>
> Si existe documentación corporativa utilizaría RAG para recuperar únicamente la información relevante y autorizada.
>
> Para operaciones críticas pondría validaciones y, cuando corresponda, aprobación humana.
>
> Finalmente diseñaría observabilidad, control de costos, manejo de errores, escalabilidad y métricas para demostrar que la solución realmente aporta valor.”

---

# PARTE XXVII — TU “MAPA MENTAL” FINAL

```text
                         IA EMPRESARIAL
                               │
        ┌──────────────────────┼───────────────────────┐
        ↓                      ↓                       ↓
       LLM                   AGENTES                DATA
        │                      │                       │
   ┌────┼────┐          ┌──────┼──────┐           ┌────┴────┐
   ↓    ↓    ↓          ↓      ↓      ↓           ↓         ↓
Tokens Prompt Models   Tools Orchestrator Memory   RAG      DB
                         │
                         ↓
                       APIs
                         │
          ┌──────────────┼───────────────┐
          ↓              ↓               ↓
         ERP           Finance         Google
          │              │               │
          └──────────────┼───────────────┘
                         ↓
                    AUTOMATIZACIÓN
                         │
             ┌───────────┼───────────┐
             ↓           ↓           ↓
          Workflow     Queue       Worker
                         │
                         ↓
                      PRODUCCIÓN
                         │
          ┌──────────────┼─────────────┐
          ↓              ↓             ↓
       Security      Observability    Cost
          │              │             │
          └──────────────┼─────────────┘
                         ↓
                    BUSINESS VALUE
```

---

# PARTE XXVIII — LAS 15 IDEAS QUE DEBES RECORDAR

## 1

> No todo necesita IA.

## 2

> No todo lo que necesita IA necesita un agente.

## 3

> El prompt no es seguridad.

## 4

> Los permisos deben estar en la arquitectura.

## 5

> El LLM no debería ejecutar directamente operaciones críticas.

## 6

> Las herramientas permiten controlar las acciones del agente.

## 7

> RAG reduce contexto innecesario y proporciona información relevante.

## 8

> RAG no garantiza cero alucinaciones.

## 9

> Más agentes no significa mejor arquitectura.

## 10

> El modelo más potente no siempre es el mejor.

## 11

> Primero mide costos antes de optimizar.

## 12

> En producción necesitas observabilidad.

## 13

> Para acciones críticas necesitas validaciones y posiblemente aprobación humana.

## 14

> Las reglas de negocio deben permanecer bajo control de la aplicación.

## 15

> La IA debe generar valor para el negocio, no solamente demostrar que la tecnología funciona.

---

# FRASE FINAL PARA LA ENTREVISTA

> **“Mi enfoque no es utilizar IA por utilizar IA. Primero entiendo el problema de negocio, identifico qué parte realmente necesita inteligencia artificial y diseño una arquitectura donde el LLM, los agentes, las APIs y las reglas de negocio trabajen de forma controlada, segura, observable y con costos sostenibles.”**

---

# FIN DEL MATERIAL

## Método de estudio recomendado

### Primera vuelta

Lee únicamente:

```text
LLM
Agentes
RAG
APIs
Seguridad
Costos
Producción
Multiagentes
```

### Segunda vuelta

Resuelve sin mirar:

```text
Ejercicio 1
Ejercicio 2
Ejercicio 3
Ejercicio 4
Ejercicio 5
```

### Tercera vuelta

Dibuja de memoria:

```text
RAG
Multiagente
ERP
Producción
Finanzas
```

### Cuarta vuelta

Responde verbalmente:

```text
¿Qué es un agente?
¿Qué es RAG?
¿Cuándo NO usar IA?
¿Cómo reduces costos?
¿Cómo proteges datos?
¿Cómo llevarías un agente a producción?
¿Cómo integrarías un ERP?
¿Cómo evitarías loops?
¿Cómo escogerías un LLM?
```

### Quinta vuelta

Haz una entrevista simulada completa sin mirar ninguna respuesta.

El objetivo no es memorizar palabra por palabra.

El objetivo es poder pensar:

> **Problema → arquitectura → seguridad → IA → integración → costos → producción → métricas.**

