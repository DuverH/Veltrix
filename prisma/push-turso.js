/**
 * @file push-turso.js
 * @description Aplica el esquema completo de Prisma a Turso LibSQL utilizando @libsql/client.
 */

const { createClient } = require("@libsql/client");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function pushToTurso() {
  const url = process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !url.startsWith("libsql://")) {
    console.error("Error: DATABASE_URL debe comenzar con 'libsql://'");
    process.exit(1);
  }

  console.log("=================================================");
  console.log("  Iniciando Migración Automática a Turso LibSQL  ");
  console.log("=================================================");
  console.log(`Conectando a: ${url}`);

  const client = createClient({
    url,
    authToken,
  });

  // 1. Generar DDL SQL usando prisma migrate diff
  console.log("\n1. Generando esquema SQL desde schema.prisma...");
  const sqlDdl = execSync(
    "npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script",
    { encoding: "utf-8" }
  );

  // 2. Limpiar comentarios y dividir en sentencias individuales
  const cleanSql = sqlDdl.replace(/--.*$/gm, "").trim();
  const statements = cleanSql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`2. Ejecutando ${statements.length} sentencias DDL en Turso...`);

  let executed = 0;
  for (const statement of statements) {
    try {
      await client.execute(statement);
      executed++;
    } catch (err) {
      // Ignorar si ya existe la tabla o índice
      if (!err.message.includes("already exists")) {
        console.warn(`Aviso en sentencia: ${err.message}`);
      } else {
        executed++;
      }
    }
  }

  console.log(`\n✅ Esquema aplicado con éxito (${executed}/${statements.length} sentencias verificadas).`);

  // 3. Ejecutar sembrado de datos (Seed)
  console.log("\n3. Sembrando datos iniciales (PUC, Administrador, Empresa base)...");
  require("./seed-data.js");
}

pushToTurso().catch((err) => {
  console.error("Error durante la migración a Turso:", err);
  process.exit(1);
});
