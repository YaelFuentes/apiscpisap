// src/lib/repositories/EjecucionRepository.js
// Repositorio para operaciones CRUD de ejecuciones

import { getDatabase } from '../database.js';

export class EjecucionRepository {
  constructor() {
    this.db = getDatabase();
  }

  // Crear ejecución
  create(ejecucion) {
    const stmt = this.db.prepare(`
      INSERT INTO ejecuciones (
        integracion_id, estado, fecha_inicio, fecha_fin, duracion,
        mensajes_procesados, mensajes_exitosos, mensajes_fallidos, 
        errores, correlation_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      ejecucion.integracion_id,
      ejecucion.estado,
      ejecucion.fecha_inicio,
      ejecucion.fecha_fin || null,
      ejecucion.duracion || null,
      ejecucion.mensajes_procesados || 0,
      ejecucion.mensajes_exitosos || 0,
      ejecucion.mensajes_fallidos || 0,
      ejecucion.errores || 0,
      ejecucion.correlation_id || null
    );
  }

  // Obtener ejecuciones por integración
  findByIntegracion(integracionId, limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM ejecuciones 
      WHERE integracion_id = ? 
      ORDER BY fecha_inicio DESC 
      LIMIT ?
    `);
    return stmt.all(integracionId, limit);
  }

  // Obtener última ejecución de una integración
  findUltimaEjecucion(integracionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM ejecuciones 
      WHERE integracion_id = ? 
      ORDER BY fecha_inicio DESC 
      LIMIT 1
    `);
    return stmt.get(integracionId);
  }

  // Obtener ejecuciones por período
  findByPeriodo(integracionId, fechaInicio, fechaFin) {
    const stmt = this.db.prepare(`
      SELECT * FROM ejecuciones 
      WHERE integracion_id = ? 
        AND fecha_inicio >= ? 
        AND fecha_inicio <= ?
      ORDER BY fecha_inicio DESC
    `);
    return stmt.all(integracionId, fechaInicio, fechaFin);
  }

  // Obtener estadísticas de ejecuciones
  getEstadisticas(integracionId, horas = 24) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN estado = 'success' THEN 1 ELSE 0 END) as exitosas,
        SUM(CASE WHEN estado = 'error' THEN 1 ELSE 0 END) as fallidas,
        SUM(CASE WHEN estado = 'warning' THEN 1 ELSE 0 END) as warnings,
        AVG(duracion) as duracion_promedio,
        SUM(mensajes_procesados) as total_mensajes,
        SUM(errores) as total_errores
      FROM ejecuciones
      WHERE integracion_id = ?
        AND fecha_inicio >= datetime('now', '-' || ? || ' hours')
    `);
    return stmt.get(integracionId, horas);
  }

  // Obtener ejecuciones por proyecto (últimas 24h)
  findByProyecto(proyectoId, horas = 24) {
    const stmt = this.db.prepare(`
      SELECT e.*, i.nombre as integracion_nombre
      FROM ejecuciones e
      JOIN integraciones i ON e.integracion_id = i.id
      WHERE i.proyecto_id = ?
        AND e.fecha_inicio >= datetime('now', '-' || ? || ' hours')
      ORDER BY e.fecha_inicio DESC
    `);
    return stmt.all(proyectoId, horas);
  }

  // Actualizar ejecución
  update(id, ejecucion) {
    const stmt = this.db.prepare(`
      UPDATE ejecuciones 
      SET estado = ?, fecha_fin = ?, duracion = ?,
          mensajes_procesados = ?, mensajes_exitosos = ?, 
          mensajes_fallidos = ?, errores = ?
      WHERE id = ?
    `);

    return stmt.run(
      ejecucion.estado,
      ejecucion.fecha_fin,
      ejecucion.duracion,
      ejecucion.mensajes_procesados,
      ejecucion.mensajes_exitosos,
      ejecucion.mensajes_fallidos,
      ejecucion.errores,
      id
    );
  }

  // Eliminar ejecuciones antiguas (cleanup)
  deleteOlderThan(dias) {
    const stmt = this.db.prepare(`
      DELETE FROM ejecuciones 
      WHERE fecha_inicio < datetime('now', '-' || ? || ' days')
    `);
    return stmt.run(dias);
  }
}
