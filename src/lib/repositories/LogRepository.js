// src/lib/repositories/LogRepository.js
// Repositorio para operaciones CRUD de logs

import { getDatabase } from '../database.js';

export class LogRepository {
  constructor() {
    this.db = getDatabase();
  }

  // Crear log
  create(log) {
    const stmt = this.db.prepare(`
      INSERT INTO logs (integracion_id, ejecucion_id, tipo, mensaje, detalles, correlation_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      log.integracion_id,
      log.ejecucion_id || null,
      log.tipo,
      log.mensaje,
      log.detalles || null,
      log.correlation_id || null,
      log.timestamp || new Date().toISOString()
    );
  }

  // Crear múltiples logs
  createMany(logs) {
    const stmt = this.db.prepare(`
      INSERT INTO logs (integracion_id, ejecucion_id, tipo, mensaje, detalles, correlation_id, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insert = this.db.transaction((logsArray) => {
      for (const log of logsArray) {
        stmt.run(
          log.integracion_id,
          log.ejecucion_id || null,
          log.tipo,
          log.mensaje,
          log.detalles || null,
          log.correlation_id || null,
          log.timestamp || new Date().toISOString()
        );
      }
    });

    return insert(logs);
  }

  // Obtener logs por integración
  findByIntegracion(integracionId, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM logs 
      WHERE integracion_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(integracionId, limit);
  }

  // Obtener logs por tipo
  findByTipo(integracionId, tipo, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM logs 
      WHERE integracion_id = ? AND tipo = ?
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(integracionId, tipo, limit);
  }

  // Obtener logs por ejecución
  findByEjecucion(ejecucionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM logs 
      WHERE ejecucion_id = ? 
      ORDER BY timestamp ASC
    `);
    return stmt.all(ejecucionId);
  }

  // Obtener logs por proyecto
  findByProyecto(proyectoId, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT l.*, i.nombre as integracion_nombre
      FROM logs l
      JOIN integraciones i ON l.integracion_id = i.id
      WHERE i.proyecto_id = ?
      ORDER BY l.timestamp DESC
      LIMIT ?
    `);
    return stmt.all(proyectoId, limit);
  }

  // Obtener logs recientes (últimas N horas)
  findRecientes(integracionId, horas = 24, limit = 100) {
    const stmt = this.db.prepare(`
      SELECT * FROM logs 
      WHERE integracion_id = ?
        AND timestamp >= datetime('now', '-' || ? || ' hours')
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(integracionId, horas, limit);
  }

  // Buscar logs por texto
  search(integracionId, searchText, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM logs 
      WHERE integracion_id = ? 
        AND (mensaje LIKE ? OR detalles LIKE ?)
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    const pattern = `%${searchText}%`;
    return stmt.all(integracionId, pattern, pattern, limit);
  }

  // Contar logs por tipo
  countByTipo(integracionId, horas = 24) {
    const stmt = this.db.prepare(`
      SELECT 
        tipo,
        COUNT(*) as count
      FROM logs
      WHERE integracion_id = ?
        AND timestamp >= datetime('now', '-' || ? || ' hours')
      GROUP BY tipo
    `);
    return stmt.all(integracionId, horas);
  }

  // Eliminar logs antiguos (cleanup)
  deleteOlderThan(dias) {
    const stmt = this.db.prepare(`
      DELETE FROM logs 
      WHERE timestamp < datetime('now', '-' || ? || ' days')
    `);
    return stmt.run(dias);
  }

  // Obtener últimos errores
  findUltimosErrores(integracionId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT * FROM logs 
      WHERE integracion_id = ? AND tipo = 'ERROR'
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    return stmt.all(integracionId, limit);
  }
}
