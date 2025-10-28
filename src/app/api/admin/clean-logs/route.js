// src/app/api/admin/clean-logs/route.js
// API para limpiar logs antiguos

import { getDatabase } from '@/lib/database';
import { LogRepository } from '@/lib/repositories/LogRepository';
import { EjecucionRepository } from '@/lib/repositories/EjecucionRepository';

export async function POST(request) {
  try {
    const body = await request.json();
    const { days } = body;

    if (!days || days < 1) {
      return Response.json(
        { error: 'Número de días inválido' },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const logRepo = new LogRepository(db);
    const ejecucionRepo = new EjecucionRepository(db);

    // Eliminar logs antiguos
    const deletedLogs = logRepo.deleteOlderThan(days);

    // Eliminar ejecuciones antiguas
    const deletedEjecuciones = ejecucionRepo.deleteOlderThan(days);

    return Response.json({
      success: true,
      deleted: deletedLogs,
      deletedEjecuciones,
      mensaje: `Eliminados ${deletedLogs} logs y ${deletedEjecuciones} ejecuciones mayores a ${days} días`
    });

  } catch (error) {
    console.error('Error limpiando logs:', error);
    return Response.json(
      { error: 'Error limpiando logs' },
      { status: 500 }
    );
  }
}
