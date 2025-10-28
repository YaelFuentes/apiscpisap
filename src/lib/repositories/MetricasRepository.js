// src/lib/repositories/MetricasRepository.js
// Repositorio para métricas y estadísticas

import { getDatabase } from '../database.js';

export class MetricasRepository {
  constructor() {
    this.db = getDatabase();
  }

  // Guardar métricas diarias
  saveDailyMetrics(proyectoId, fecha, metricas) {
    const stmt = this.db.prepare(`
      INSERT INTO metricas_diarias (
        proyecto_id, fecha, total_ejecuciones, ejecuciones_exitosas,
        ejecuciones_fallidas, ejecuciones_warning, tiempo_promedio_ms, disponibilidad
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(proyecto_id, fecha) DO UPDATE SET
        total_ejecuciones = excluded.total_ejecuciones,
        ejecuciones_exitosas = excluded.ejecuciones_exitosas,
        ejecuciones_fallidas = excluded.ejecuciones_fallidas,
        ejecuciones_warning = excluded.ejecuciones_warning,
        tiempo_promedio_ms = excluded.tiempo_promedio_ms,
        disponibilidad = excluded.disponibilidad,
        updated_at = CURRENT_TIMESTAMP
    `);

    return stmt.run(
      proyectoId,
      fecha,
      metricas.total_ejecuciones,
      metricas.ejecuciones_exitosas,
      metricas.ejecuciones_fallidas,
      metricas.ejecuciones_warning || 0,
      metricas.tiempo_promedio_ms,
      metricas.disponibilidad
    );
  }

  // Guardar métricas por hora
  saveHourlyMetrics(proyectoId, fechaHora, ejecuciones) {
    const stmt = this.db.prepare(`
      INSERT INTO metricas_horarias (proyecto_id, fecha_hora, ejecuciones)
      VALUES (?, ?, ?)
      ON CONFLICT(proyecto_id, fecha_hora) DO UPDATE SET
        ejecuciones = ejecuciones + excluded.ejecuciones
    `);

    return stmt.run(proyectoId, fechaHora, ejecuciones);
  }

  // Obtener métricas diarias
  getDailyMetrics(proyectoId, dias = 30) {
    const stmt = this.db.prepare(`
      SELECT * FROM metricas_diarias
      WHERE proyecto_id = ?
        AND fecha >= date('now', '-' || ? || ' days')
      ORDER BY fecha DESC
    `);
    return stmt.all(proyectoId, dias);
  }

  // Obtener métricas por hora (últimas 24h)
  getHourlyMetrics(proyectoId, horas = 24) {
    const stmt = this.db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', fecha_hora) as hora,
        SUM(ejecuciones) as ejecuciones
      FROM metricas_horarias
      WHERE proyecto_id = ?
        AND fecha_hora >= datetime('now', '-' || ? || ' hours')
      GROUP BY hora
      ORDER BY hora DESC
    `);
    return stmt.all(proyectoId, horas);
  }

  // Calcular métricas en tiempo real desde ejecuciones
  calculateRealtimeMetrics(proyectoId, horas = 24) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_ejecuciones,
        SUM(CASE WHEN e.estado = 'success' THEN 1 ELSE 0 END) as exitosas,
        SUM(CASE WHEN e.estado = 'error' THEN 1 ELSE 0 END) as fallidas,
        SUM(CASE WHEN e.estado = 'warning' THEN 1 ELSE 0 END) as warnings,
        SUM(CASE WHEN e.estado = 'processing' THEN 1 ELSE 0 END) as en_cola,
        AVG(e.duracion) as tiempo_promedio_ms,
        SUM(e.mensajes_procesados) as total_mensajes,
        SUM(e.errores) as total_errores
      FROM ejecuciones e
      JOIN integraciones i ON e.integracion_id = i.id
      WHERE i.proyecto_id = ?
        AND e.fecha_inicio >= datetime('now', '-' || ? || ' hours')
    `);

    const result = stmt.get(proyectoId, horas);
    
    // Calcular disponibilidad
    if (result.total_ejecuciones > 0) {
      result.disponibilidad = ((result.exitosas / result.total_ejecuciones) * 100).toFixed(2);
    } else {
      result.disponibilidad = 0;
    }

    return result;
  }

  // Obtener ejecuciones agrupadas por hora
  getEjecucionesPorHora(proyectoId, horas = 24) {
    const stmt = this.db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', e.fecha_inicio) as hora,
        COUNT(*) as ejecuciones,
        SUM(CASE WHEN e.estado = 'success' THEN 1 ELSE 0 END) as exitosas,
        SUM(CASE WHEN e.estado = 'error' THEN 1 ELSE 0 END) as fallidas
      FROM ejecuciones e
      JOIN integraciones i ON e.integracion_id = i.id
      WHERE i.proyecto_id = ?
        AND e.fecha_inicio >= datetime('now', '-' || ? || ' hours')
      GROUP BY hora
      ORDER BY hora ASC
    `);
    return stmt.all(proyectoId, horas);
  }

  // Obtener resumen de todas las integraciones de un proyecto
  getProyectoSummary(proyectoId) {
    const stmt = this.db.prepare(`
      SELECT 
        i.id,
        i.nombre,
        i.estado as estado_actual,
        COUNT(e.id) as total_ejecuciones,
        MAX(e.fecha_inicio) as ultima_ejecucion,
        AVG(e.duracion) as duracion_promedio,
        SUM(e.mensajes_procesados) as mensajes_procesados,
        SUM(e.errores) as errores
      FROM integraciones i
      LEFT JOIN ejecuciones e ON i.id = e.integracion_id 
        AND e.fecha_inicio >= datetime('now', '-24 hours')
      WHERE i.proyecto_id = ? AND i.activo = 1
      GROUP BY i.id
      ORDER BY i.nombre
    `);
    return stmt.all(proyectoId);
  }

  // Limpiar métricas antiguas
  cleanupOldMetrics(dias) {
    const stmtDaily = this.db.prepare(`
      DELETE FROM metricas_diarias 
      WHERE fecha < date('now', '-' || ? || ' days')
    `);
    
    const stmtHourly = this.db.prepare(`
      DELETE FROM metricas_horarias 
      WHERE fecha_hora < datetime('now', '-' || ? || ' days')
    `);

    stmtDaily.run(dias);
    stmtHourly.run(dias);
  }
}
