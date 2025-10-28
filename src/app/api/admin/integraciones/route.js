// src/app/api/admin/integraciones/route.js
// API para gestionar integraciones (listar, crear, eliminar)

import { getDatabase } from '@/lib/database';
import { IntegracionRepository } from '@/lib/repositories/IntegracionRepository';

// GET - Listar todas las integraciones
export async function GET() {
  try {
    const db = getDatabase();
    const repo = new IntegracionRepository(db);

    const integraciones = repo.findAll();

    return Response.json({
      integraciones,
      total: integraciones.length
    });

  } catch (error) {
    console.error('Error obteniendo integraciones:', error);
    return Response.json(
      { error: 'Error obteniendo integraciones' },
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
    const repo = new IntegracionRepository(db);

    // Generar ID único
    const prefix = proyecto_id.substring(0, 5).toUpperCase();
    const existing = repo.findByProyecto(proyecto_id);
    const nextNum = String(existing.length + 1).padStart(3, '0');
    const id = `${prefix}-QAS-${nextNum}`;

    // Crear integración
    repo.create({
      id,
      proyecto_id,
      nombre,
      descripcion: descripcion || '',
      intervalo: intervalo || 600000,
      criticidad: criticidad || 'media',
      estado: 'success',
      activo: 1
    });

    return Response.json({
      success: true,
      id,
      mensaje: 'Integración creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando integración:', error);
    return Response.json(
      { error: 'Error creando integración' },
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
    const repo = new IntegracionRepository(db);

    // Eliminar integración (cascade eliminará ejecuciones y logs)
    repo.delete(id);

    return Response.json({
      success: true,
      mensaje: 'Integración eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando integración:', error);
    return Response.json(
      { error: 'Error eliminando integración' },
      { status: 500 }
    );
  }
}
