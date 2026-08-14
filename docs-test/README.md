# Documentos de prueba para la práctica RAG

Estos archivos se **auto-indexan al iniciar el servidor** (boot) como si se hubieran
subido desde la UI: aparecen en "Base Vectorial" → Inspección de chunks.

| Archivo | Contenido | Owner | Visible por demo |
|---|---|---|---|
| `inventario.txt` | stock y reposición | inventario | sí |
| `proveedores.txt` | proveedores (público) | publico | sí |
| `vacaciones.txt` | política de vacaciones | rh | sí |
| `empleados.txt` | salarios y contraseñas (CONFIDENCIAL) | it | NO (RBAC lo bloquea) |
| `seguridad.txt` | política de contraseñas y 2FA | it | NO (RBAC lo bloquea) |

## Práctica recomendada

Los 5 archivos ya están indexados al arrancar. Si querés ver el flujo de subida
manual: click "Reiniciar" en Base Vectorial y arrastrá los archivos de nuevo.

1. Como usuario `demo` preguntá:
   - "¿Qué productos están en stock bajo?" → responde con inventario
   - "¿Cuál es el teléfono de Papelera Centro?" → responde con proveedores
   - "¿Cuál es el salario de Juan Pérez?" → documento encontrado pero BLOQUEADO (RBAC): demo no ve `it`
   - "¿Cada cuánto se rotan las contraseñas?" → bloqueado por permisos
2. Como usuario `admin` las mismas preguntas → sí responde con los documentos sensibles.

## Sin API key válida (modo local)

Si las APIs fallan, la práctica sigue funcionando: embeddings locales y, si el LLM no está
disponible, la respuesta muestra las fuentes recuperadas con aviso "[Modo local]".