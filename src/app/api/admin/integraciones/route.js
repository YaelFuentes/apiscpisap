// src/app/api/admin/integraciones/route.js
// API para gestionar integraciones (listar, crear, eliminar)

import { getDatabase } from '@/lib/db-client';

// GET - Listar todas las integraciones
export async function GET() {
  try {
    const db = getDatabase();
    const result = await db.execute({
      sql: 'SELECT * FROM integraciones ORDER BY nombre',
      args: []
    });
    const integraciones = result.rows || [];

    return Response.json({
      integraciones,
      total: integraciones.length
    });

  } catch (error) {
    console.error('Error obteniendo integraciones:', error);
    return Response.json(
      { error: 'Error obteniendo integraciones', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Crear nueva integración
export async function POST(request) {
  try {
    const body = await request.json();
    const { nombre, descripcion, proyecto_id, criticidad, intervalo } = body;

    if (!nombre || !proyecto_id) {
      return Response.json(
        { error: 'Nombre y proyecto_id son requeridos' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Generar ID único
    const prefix = proyecto_id.substring(0, 5).toUpperCase();
    const existingResult = await db.execute({
      sql: 'SELECT COUNT(*) as count FROM integraciones WHERE proyecto_id = ?',
      args: [proyecto_id]
    });
    const count = existingResult.rows[0]?.count || 0;
    const nextNum = String(count + 1).padStart(3, '0');
    const id = `${prefix}-QAS-${nextNum}`;

    // Crear integración
    await db.execute({
      sql: `INSERT INTO integraciones (id, proyecto_id, nombre, descripcion, intervalo, criticidad, estado, activo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, proyecto_id, nombre, descripcion || '', intervalo || 600000, criticidad || 'media', 'success', 1]
    });

    return Response.json({
      success: true,
      id,
      mensaje: 'Integración creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando integración:', error);
    return Response.json(
      { error: 'Error creando integración', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar integración
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { error: 'ID de integración requerido' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Eliminar integración (cascade eliminará ejecuciones y logs)
    await db.execute({
      sql: 'DELETE FROM integraciones WHERE id = ?',
      args: [id]
    });

    return Response.json({
      success: true,
      mensaje: 'Integración eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando integración:', error);
    return Response.json(
      { error: 'Error eliminando integración', details: error.message },
      { status: 500 }
    );
  }
}
