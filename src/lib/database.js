// src/lib/database.js
// Configuración y gestión de la base de datos SQLite

import Database from 'better-sqlite3';
import path from 'path';

// Ruta de la base de datos
const dbPath = path.join(process.cwd(), 'data', 'sap-cpi-monitor.db');

// Crear instancia de base de datos
let db = null;

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
    initializeDatabase(db);
  }
  return db;
}

// Inicializar esquema de base de datos
function initializeDatabase(database) {
  // Tabla: proyectos
  database.exec(`
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
  database.exec(`
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
  database.exec(`
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
  database.exec(`
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
  database.exec(`
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
  database.exec(`
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
  database.exec(`
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

  // Índices para mejorar rendimiento
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_ejecuciones_integracion ON ejecuciones(integracion_id);
    CREATE INDEX IF NOT EXISTS idx_ejecuciones_fecha ON ejecuciones(fecha_inicio);
    CREATE INDEX IF NOT EXISTS idx_logs_integracion ON logs(integracion_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_logs_tipo ON logs(tipo);
    CREATE INDEX IF NOT EXISTS idx_metricas_horarias_fecha ON metricas_horarias(fecha_hora);
    CREATE INDEX IF NOT EXISTS idx_alertas_estado ON alertas(estado);
  `);

  console.log('✅ Base de datos inicializada correctamente');
}

// Cerrar conexión a la base de datos
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

export default getDatabase;
