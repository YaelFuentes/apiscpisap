// src/lib/db-client.js
// Cliente unificado que decide qué base de datos usar

const isTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;

let dbModule;

if (isTurso) {
  // Usar Turso en producción/Vercel
  dbModule = await import('./database-turso.js');
} else {
  // Usar SQLite local en desarrollo
  dbModule = await import('./database.js');
}

export const getDatabase = dbModule.getDatabase;
export const closeDatabase = dbModule.closeDatabase;
export default dbModule.default;
