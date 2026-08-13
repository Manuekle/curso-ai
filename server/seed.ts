// server/seed.ts
// Indexa documentos de ejemplo en la store local. Correr: npm run seed
// También se usa como función: server.ts la llama al boot si la store está vacía.

import "dotenv/config";
import { indexDocument, store } from "./rag.js";

const docs = [
  {
    id: "politica-vacaciones",
    owner: "rh",
    text: `Política de vacaciones de la empresa.
    Cada empleado tiene derecho a 22 días hábiles de vacaciones por año completo trabajado.
    Las vacaciones deben solicitarse con al menos 15 días de anticipación a través del sistema RH.
    El período de vacaciones no puede dividirse en más de 3 bloques.
    Los días no usados al cierre del año se pierden, excepto por razones médicas justificadas con certificado.
    Durante el período de vacaciones el empleado no tiene acceso a herramientas de trabajo corporativas.`,
  },
  {
    id: "politica-inventario",
    owner: "inventario",
    text: `Política de reposición de inventario.
    Un producto se considera en stock bajo cuando su cantidad es menor a 10 unidades.
    Los productos con stock bajo deben reordenarse automáticamente a través del proveedor principal.
    El pedido de reposición equivale a 30 días de demanda promedio histórica.
    Los movimientos de inventario (entradas, salidas, ajustes) deben registrarse con su ID de usuario responsable.
    El inventario se audita de forma completa cada trimestre y por muestreo mensual.`,
  },
  {
    id: "politica-seguridad",
    owner: "it",
    text: `Política de seguridad de la información.
    Es obligatorio usar autenticación de dos factores para acceder a sistemas internos.
    Las contraseñas deben tener al menos 12 caracteres y rotarse cada 90 días.
    Está prohibido compartir credenciales o usar cuentas compartidas.
    Los datos personales de clientes deben cifrarse en reposo y en tránsito.
    Cualquier incidente de seguridad debe reportarse dentro de las 2 horas al equipo de IT.
    El acceso a datos sensibles se concede bajo el principio de mínimo privilegio y se audita trimestralmente.`,
  },
];

export async function seedDocs(): Promise<number> {
  for (const d of docs) {
    const n = await indexDocument(d.id, d.text, d.owner);
    console.log(`Indexado ${d.id} → ${n} chunks`);
  }
  return store.length;
}

// Solo corre directamente (npm run seed)
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedDocs();
  console.log(`\nStore local: ${store.length} chunks. Usuarios: admin (ve todo), demo (rh + inventario).`);
  console.log("Probá: '¿Cuántos días de vacaciones tengo?' como demo → NO debería responder (owner=it)... " +
    "es un ejemplo: la política de vacaciones es de rh, que demo sí puede ver.");
}