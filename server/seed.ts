// server/seed.ts
// Indexa documentos de ejemplo en la store local. Correr: npm run seed
// También se usa como función: server.ts la llama al boot si la store está vacía.

import "dotenv/config";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { indexDocument, store } from "./rag.js";

// Carpeta con documentos de prueba (txt) para la práctica. Se indexan al boot
// como si se hubieran subido por la UI: quedan visibles en "Base Vectorial".
const DOCS_TEST_DIR = fileURLToPath(new URL("../docs-test", import.meta.url));

const OWNER_BY_FILE: Record<string, string> = {
  "inventario.txt": "inventario",
  "proveedores.txt": "publico",
  "empleados.txt": "it", // CONFIDENCIAL: demo NO debe verlo (RBAC)
  "seguridad.txt": "it", // CONFIDENCIAL: demo NO debe verlo (RBAC)
  "vacaciones.txt": "rh",
};

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
  {
    id: "registro-empleados",
    owner: "it",
    text: `Registro interno de empleados (confidencial, acceso solo IT y RRHH autorizado).
    Juan Pérez — DNI 28.554.912 — salario mensual $850.000 — rol: desarrollador senior — contraseña de intranet: Jp-2024-x9!k
    María Gómez — DNI 31.208.447 — salario mensual $720.000 — rol: diseñadora — contraseña de intranet: Mg-vacaciones77#
    Carlos Ruiz — DNI 27.901.335 — salario mensual $1.200.000 — rol: gerente de operaciones — contraseña de intranet: Cr-operaciones2024
    Las contraseñas de intranet no deben compartirse por chat ni email. El acceso al registro se audita mensualmente.`,
  },
  {
    id: "info-proveedores",
    owner: "publico",
    text: `Información pública de proveedores.
    Proveedor principal de papelería: Papelera Centro S.A. — contacto: ventas@papeleracentro.com — teléfono: +54 11 4321-0099.
    Proveedor de tecnología: Tecnored S.A. — contacto: hola@tecnored.com — teléfono: +54 11 4789-2211.
    Proveedor de limpieza: Servilimp S.R.L. — contacto: info@servilimp.com — teléfono: +54 11 4655-7788.
    Los pedidos a proveedores se hacen con 15 días de anticipación y se registran en el sistema de compras.`,
  },
  {
    id: "politica-privacidad",
    owner: "publico",
    text: `Política de privacidad de datos personales (pública).
    Recopilamos únicamente los datos necesarios para la prestación del servicio.
    Los datos se conservan mientras dure la relación comercial y se eliminan a solicitud del titular.
    Nunca vendemos datos personales a terceros.
    Para ejercer tus derechos de acceso, rectificación o supresión escribí a privacidad@empresa.com.`,
  },
];

export async function seedDocs(): Promise<number> {
  for (const d of docs) {
    const { chunks: n } = await indexDocument(d.id, d.text, d.owner);
    console.log(`Indexado ${d.id} → ${n} chunks`);
  }
  return store.length;
}

// Indexa los .txt de docs-test/ como si se hubieran subido desde la UI.
export async function seedDocsTest(): Promise<number> {
  let files: string[];
  try {
    files = (await readdir(DOCS_TEST_DIR)).filter((f) => f.endsWith(".txt"));
  } catch {
    console.warn("docs-test/ no encontrado — se omite el seed de archivos de prueba.");
    return 0;
  }
  for (const f of files) {
    const text = await readFile(join(DOCS_TEST_DIR, f), "utf8");
    const owner = OWNER_BY_FILE[f] ?? "demo";
    const id = `docs-${f}`;
    const { chunks: n } = await indexDocument(id, text, owner);
    console.log(`Indexado ${id} (owner: ${owner}) → ${n} chunks`);
  }
  return store.length;
}

// Seed completo: políticas + archivos de prueba de docs-test/
export async function seedAll(): Promise<number> {
  await seedDocs();
  await seedDocsTest();
  return store.length;
}

// Solo corre directamente (npm run seed)
if (import.meta.url === `file://${process.argv[1]}`) {
  await seedAll();
  const { saveStore } = await import("./store-persist.js");
  saveStore(store);
  console.log(`\nStore local: ${store.length} chunks.`);
  console.log("Usuarios: admin (ve todo) · demo (ve rh + inventario + publico, NO it).");
  console.log("\nProbá en Playground (usuario demo):");
  console.log("  - '¿Cuántos días de vacaciones tengo?'        → vacaciones (rh)");
  console.log("  - '¿Qué productos están en stock bajo?'        → inventario");
  console.log("  - '¿Cuál es el proveedor de tecnología?'       → proveedores (publico)");
  console.log("  - '¿Cuál es el salario de Juan Pérez?'         → empleados (it) → BLOQUEADO por RBAC");
  console.log("  - '¿Cada cuánto se rotan las contraseñas?'     → seguridad (it) → BLOQUEADO por RBAC");
}