// src/app/api/admin/logs/[id]/route.js
// API para eliminar un log específico por ID
import { NextResponse } from 'next/server';
import getDatabase from '@/lib/db-client';

export async function DELETE(request, { params }) {
  try {
    // En Next.js 15+, params es una Promise que debe ser unwrapped
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de log requerido' },
        { status: 400 }
      );
    }

    // Obtener el cliente de base de datos
    const db = getDatabase();

    // Eliminar el log de la base de datos
    const result = await db.execute({
      sql: 'DELETE FROM logs WHERE id = ?',
      args: [parseInt(id)]
    });

    // Verificar si se eliminó algún registro
    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { error: 'Log no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Log eliminado exitosamente',
      id: parseInt(id)
    });

  } catch (error) {
    console.error('Error eliminando log:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el log', details: error.message },
      { status: 500 }
    );
  }
}
