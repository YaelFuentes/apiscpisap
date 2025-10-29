// src/lib/database-turso.js
// Configuración para usar Turso (SQLite en Vercel)

import { createClient } from '@libsql/client';

let db = null;
let connectionTested = false;

export function getDatabase() {
  if (!db) {
    const url = process.env.database_TURSO_DATABASE_URL;
    const authToken = process.env.database_TURSO_AUTH_TOKEN;

    if (!url || !authToken) {
      console.error('❌ ERROR: Faltan variables de entorno');
      console.error('database_TURSO_DATABASE_URL:', url ? '✓ Configurada' : '✗ No configurada');
      console.error('database_TURSO_AUTH_TOKEN:', authToken ? '✓ Configurada' : '✗ No configurada');
      throw new Error('Faltan las variables de entorno database_TURSO_DATABASE_URL o database_TURSO_AUTH_TOKEN');
    }

    try {
      db = createClient({
        url,
        authToken,
      });

      console.log('🔗 Intentando conectar a Turso...');
      console.log('📍 URL:', url.substring(0, 30) + '...');
      console.log('✅ Cliente Turso creado exitosamente');
      
      // Test de conexión asíncrono
      if (!connectionTested) {
        testConnection(db);
        connectionTested = true;
      }
      
    } catch (error) {
      console.error('❌ ERROR al crear cliente Turso:', error.message);
      throw error;
    }
  }
  return db;
}

// Función para probar la conexión
async function testConnection(client) {
  try {
    const result = await client.execute('SELECT 1 as test');
    if (result.rows && result.rows.length > 0) {
      console.log('✅ CONEXIÓN A TURSO EXITOSA - Base de datos respondiendo correctamente');
    }
  } catch (error) {
    console.error('❌ ERROR: Fallo al conectar con Turso:', error.message);
  }
}

// Ejecutar consultas preparadas (compatible con better-sqlite3)
export class PreparedStatement {
  constructor(client, sql) {
    this.client = client;
    this.sql = sql;
  }

  async run(...params) {
    const result = await this.client.execute({
      sql: this.sql,
      args: params,
    });
    return {
      changes: result.rowsAffected,
      lastInsertRowid: result.lastInsertRowid,
    };
  }

  async get(...params) {
    const result = await this.client.execute({
      sql: this.sql,
      args: params,
    });
    return result.rows[0] || null;
  }

  async all(...params) {
    const result = await this.client.execute({
      sql: this.sql,
      args: params,
    });
    return result.rows;
  }
}

// Adaptar la interfaz de better-sqlite3 a Turso
export class DatabaseAdapter {
  constructor(client) {
    this.client = client;
  }

  prepare(sql) {
    return new PreparedStatement(this.client, sql);
  }

  async exec(sql) {
    await this.client.execute(sql);
  }

  async transaction(fn) {
    await this.client.execute('BEGIN');
    try {
      await fn();
      await this.client.execute('COMMIT');
    } catch (error) {
      await this.client.execute('ROLLBACK');
      throw error;
    }
  }
}

// Inicializar esquema de base de datos en Turso
export async function initializeDatabase() {
  const client = getDatabase();

  try {
    // Tabla: proyectos
    await client.execute(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        ambiente TEXT NOT NULL,
        protocolo TEXT NOT NULL,
        color TEXT,
        contacto_responsable TEXT,
        contacto_email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabla: integraciones
    await client.execute(`
      CREATE TABLE IF NOT EXISTS integraciones (
        id TEXT PRIMARY KEY,
        proyecto_id TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        intervalo INTEGER DEFAULT 300000,
        criticidad TEXT CHECK(criticidad IN ('alta', 'media', 'baja')) DEFAULT 'media',
        estado TEXT CHECK(estado IN ('success', 'warning', 'error', 'processing')) DEFAULT 'success',
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
      )
    `);

    // Tabla: ejecuciones
    await client.execute(`
      CREATE TABLE IF NOT EXISTS ejecuciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        integracion_id TEXT NOT NULL,
        estado TEXT CHECK(estado IN ('success', 'warning', 'error', 'processing')) NOT NULL,
        fecha_inicio DATETIME NOT NULL,
        fecha_fin DATETIME,
        duracion INTEGER,
        mensajes_procesados INTEGER DEFAULT 0,
        mensajes_exitosos INTEGER DEFAULT 0,
        mensajes_fallidos INTEGER DEFAULT 0,
        errores INTEGER DEFAULT 0,
        correlation_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (integracion_id) REFERENCES integraciones(id) ON DELETE CASCADE
      )
    `);

    // Tabla: logs
    await client.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        integracion_id TEXT NOT NULL,
        ejecucion_id INTEGER,
        tipo TEXT CHECK(tipo IN ('SUCCESS', 'INFO', 'WARNING', 'ERROR')) NOT NULL,
        mensaje TEXT NOT NULL,
        detalles TEXT,
        correlation_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (integracion_id) REFERENCES integraciones(id) ON DELETE CASCADE,
        FOREIGN KEY (ejecucion_id) REFERENCES ejecuciones(id) ON DELETE SET NULL
      )
    `);

    // Tabla: metricas_diarias
    await client.execute(`
      CREATE TABLE IF NOT EXISTS metricas_diarias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proyecto_id TEXT NOT NULL,
        fecha DATE NOT NULL,
        total_ejecuciones INTEGER DEFAULT 0,
        ejecuciones_exitosas INTEGER DEFAULT 0,
        ejecuciones_fallidas INTEGER DEFAULT 0,
        ejecuciones_warning INTEGER DEFAULT 0,
        tiempo_promedio_ms INTEGER DEFAULT 0,
        disponibilidad REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
        UNIQUE(proyecto_id, fecha)
      )
    `);

    // Tabla: metricas_horarias
    await client.execute(`
      CREATE TABLE IF NOT EXISTS metricas_horarias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        proyecto_id TEXT NOT NULL,
        fecha_hora DATETIME NOT NULL,
        ejecuciones INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
        UNIQUE(proyecto_id, fecha_hora)
      )
    `);

    // Tabla: alertas
    await client.execute(`
      CREATE TABLE IF NOT EXISTS alertas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        integracion_id TEXT NOT NULL,
        tipo TEXT CHECK(tipo IN ('error', 'warning', 'info')) NOT NULL,
        titulo TEXT NOT NULL,
        mensaje TEXT NOT NULL,
        estado TEXT CHECK(estado IN ('activa', 'resuelta', 'ignorada')) DEFAULT 'activa',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME,
        FOREIGN KEY (integracion_id) REFERENCES integraciones(id) ON DELETE CASCADE
      )
    `);

    // Tabla: apis_personalizadas (nuevas APIs dinámicas por sistema)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS apis_personalizadas (
        id TEXT PRIMARY KEY,
        sistema TEXT NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        tipo_integracion TEXT NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        proyecto_id TEXT NOT NULL,
        integracion_id TEXT NOT NULL,
        activo BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
        FOREIGN KEY (integracion_id) REFERENCES integraciones(id) ON DELETE CASCADE
      )
    `);

    // Índices para mejorar rendimiento
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_ejecuciones_integracion ON ejecuciones(integracion_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_ejecuciones_fecha ON ejecuciones(fecha_inicio)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_logs_integracion ON logs(integracion_id)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_logs_tipo ON logs(tipo)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_metricas_horarias_fecha ON metricas_horarias(fecha_hora)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas(estado)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_apis_sistema ON apis_personalizadas(sistema)`);
    await client.execute(`CREATE INDEX IF NOT EXISTS idx_apis_endpoint ON apis_personalizadas(endpoint)`);

    console.log('✅ Base de datos Turso inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando Turso:', error);
    throw error;
  }
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export default getDatabase;
