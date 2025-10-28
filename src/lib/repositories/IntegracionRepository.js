// src/lib/repositories/IntegracionRepository.js
// Repositorio para operaciones CRUD de integraciones

import { getDatabase } from '../database.js';

export class IntegracionRepository {
  constructor() {
    this.db = getDatabase();
  }

  // Crear integración
  create(integracion) {
    const stmt = this.db.prepare(`
      INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      integracion.id,
      integracion.proyecto_id,
      integracion.nombre,
      integracion.descripcion || null,
      integracion.intervalo || 300000,
      integracion.criticidad || 'media',
      integracion.estado || 'success',
      integracion.activo !== undefined ? integracion.activo : 1
    );
  }

  // Obtener todas las integraciones
  findAll() {
    const stmt = this.db.prepare('SELECT * FROM integraciones ORDER BY nombre');
    return stmt.all();
  }

  // Obtener integración por ID
  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM integraciones WHERE id = ?');
    return stmt.get(id);
  }

  // Obtener integraciones por proyecto
  findByProyecto(proyectoId) {
    const stmt = this.db.prepare(`
      SELECT * FROM integraciones 
      WHERE proyecto_id = ? AND activo = 1
      ORDER BY nombre
    `);
    return stmt.all(proyectoId);
  }

  // Actualizar estado de integración
  updateEstado(id, estado) {
    const stmt = this.db.prepare(`
      UPDATE integraciones 
      SET estado = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(estado, id);
  }

  // Actualizar integración completa
  update(id, integracion) {
    const stmt = this.db.prepare(`
      UPDATE integraciones 
      SET nombre = ?, descripcion = ?, intervalo = ?, criticidad = ?, 
          estado = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(
      integracion.nombre,
      integracion.descripcion,
      integracion.intervalo,
      integracion.criticidad,
      integracion.estado,
      integracion.activo,
      id
    );
  }

  // Eliminar integración
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM integraciones WHERE id = ?');
    return stmt.run(id);
  }

  // Obtener estadísticas de integración
  getEstadisticas(id) {
    const stmt = this.db.prepare(`
      SELECT 
        i.*,
        COUNT(e.id) as total_ejecuciones,
        SUM(CASE WHEN e.estado = 'success' THEN 1 ELSE 0 END) as ejecuciones_exitosas,
        SUM(CASE WHEN e.estado = 'error' THEN 1 ELSE 0 END) as ejecuciones_fallidas,
        AVG(e.duracion) as duracion_promedio,
        MAX(e.fecha_inicio) as ultima_ejecucion
      FROM integraciones i
      LEFT JOIN ejecuciones e ON i.id = e.integracion_id
      WHERE i.id = ?
      GROUP BY i.id
    `);
    return stmt.get(id);
  }
}
