// src/lib/repositories/ProyectoRepository.js
// Repositorio para operaciones CRUD de proyectos

import { getDatabase } from '../database.js';

export class ProyectoRepository {
  constructor() {
    this.db = getDatabase();
  }

  // Crear proyecto
  create(proyecto) {
    const stmt = this.db.prepare(`
      INSERT INTO proyectos (id, nombre, descripcion, ambiente, protocolo, color, contacto_responsable, contacto_email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      proyecto.id,
      proyecto.nombre,
      proyecto.descripcion || null,
      proyecto.ambiente,
      proyecto.protocolo,
      proyecto.color || null,
      proyecto.contacto_responsable || null,
      proyecto.contacto_email || null
    );
  }

  // Obtener todos los proyectos
  findAll() {
    const stmt = this.db.prepare('SELECT * FROM proyectos ORDER BY nombre');
    return stmt.all();
  }

  // Obtener proyecto por ID
  findById(id) {
    const stmt = this.db.prepare('SELECT * FROM proyectos WHERE id = ?');
    return stmt.get(id);
  }

  // Actualizar proyecto
  update(id, proyecto) {
    const stmt = this.db.prepare(`
      UPDATE proyectos 
      SET nombre = ?, descripcion = ?, ambiente = ?, protocolo = ?, 
          color = ?, contacto_responsable = ?, contacto_email = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(
      proyecto.nombre,
      proyecto.descripcion,
      proyecto.ambiente,
      proyecto.protocolo,
      proyecto.color,
      proyecto.contacto_responsable,
      proyecto.contacto_email,
      id
    );
  }

  // Eliminar proyecto
  delete(id) {
    const stmt = this.db.prepare('DELETE FROM proyectos WHERE id = ?');
    return stmt.run(id);
  }

  // Obtener proyectos por ambiente
  findByAmbiente(ambiente) {
    const stmt = this.db.prepare('SELECT * FROM proyectos WHERE ambiente = ?');
    return stmt.all(ambiente);
  }
}
